const express = require('express')
const cors = require('cors')
const path = require('path')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const bodyParser = require('body-parser')

const app = express()
const port = 3000

app.use(cors())
app.use(bodyParser.json()) // Для обработки JSON-запросов
app.use('/assets', express.static(path.join(__dirname, 'assets')))

const JWT_SECRET = 'AngularProjectToken' // Секретный ключ для токенов
const JWT_REFRESH_SECRET = 'AngularRefreshToken' // Секретный ключ для рефреш-токенов

// Простая база данных пользователей и профилей
const users = [
	{
		id: 1,
		username: 'user1',
		password: bcrypt.hashSync('123', 10), // Захешированный пароль
		name: 'Wade Wilson',
		nickname: 'Deadpool',
		description:
			'Wade Wilson was born in Canada, but grew up to become the least Canadian person ever. When it comes to the Merc with a Mouth, with great power comes no responsibility.',
		power: [
			'Hand-to-Hand Combat',
			'Healing Factor',
			'Immortality',
			'Superior Marksmanship',
		],
		subscriptionsAmount: '0',
		isActive: true,
		avatar: 'http://localhost:3000/assets/deadpool.png',
		subscribers: [2],
	},
	{
		id: 2,
		username: 'Logan',
		password: bcrypt.hashSync('456', 10),
		name: 'James Howlett',
		nickname: 'Wolverine',
		description:
			'From the northern wilderness of Canada hails one of the gruffest, most irascible, totally cynical and brooding member of the X-Men ever to grace the team with his presence.',
		power: [
			'Heightened Senses',
			'Regeneration',
			'Superhuman Strength',
			'Superhuman Durability',
			'Superhuman Speed',
			'Superhuman Reflexes',
		],
		subscriptionsAmount: '0',
		isActive: true,
		avatar: 'http://localhost:3000/assets/wolverine.png',
		subscribers: [1, 3],
	},
	{
		id: 3,
		username: 'user3',
		password: bcrypt.hashSync('789', 10),
		name: 'Tony Stark',
		nickname: 'Iron Man',
		description:
			'Genius. Billionaire. Philanthropist. Tony Stark confidence is only matched by his high-flying abilities as the hero called Iron Man.',
		power: [
			'Heightened Senses',
			'Regeneration',
			'Superhuman Strength',
			'Genius Intelligence',
		],
		subscriptionsAmount: '0',
		isActive: true,
		avatar: 'http://localhost:3000/assets/ironman.png',
		subscribers: [],
	},
]

// Маршрут для логина
app.post('/api/login', (req, res) => {
	const { username, password } = req.body

	// Поиск пользователя по имени пользователя
	const user = users.find(u => u.username === username)
	if (!user) {
		return res.status(401).json({ message: 'Invalid credentials' })
	}

	// Проверка пароля
	const isPasswordValid = bcrypt.compareSync(password, user.password)
	if (!isPasswordValid) {
		return res.status(401).json({ message: 'Invalid credentials' })
	}

	// Создание токенов
	const accessToken = jwt.sign(
		{ id: user.id, username: user.username },
		JWT_SECRET,
		{ expiresIn: '1d' }
	)
	const refreshToken = jwt.sign(
		{ id: user.id, username: user.username },
		JWT_REFRESH_SECRET,
		{ expiresIn: '7d' }
	)

	// Возвращаем токены клиенту
	res.json({
		accessToken,
		refreshToken,
	})
})

// Маршрут для обновления токена
app.post('/api/refresh-token', (req, res) => {
	const { refreshToken } = req.body
	if (!refreshToken) {
		return res.status(401).json({ message: 'Refresh token required' })
	}

	jwt.verify(refreshToken, JWT_REFRESH_SECRET, (err, user) => {
		if (err) {
			return res.status(403).json({ message: 'Invalid refresh token' })
		}

		// Создание нового access токена
		const accessToken = jwt.sign(
			{ id: user.id, username: user.username },
			JWT_SECRET,
			{ expiresIn: '1m' }
		)

		res.json({ accessToken })
	})
})

// Middleware для аутентификации
function authenticateToken(req, res, next) {
	const authHeader = req.headers['authorization']
	const token = authHeader && authHeader.split(' ')[1]

	if (token == null) return res.sendStatus(401)

	jwt.verify(token, JWT_SECRET, (err, user) => {
		if (err) return res.sendStatus(403)
		req.user = user
		next()
	})
}

// Маршрут для получения данных профиля текущего пользователя
app.get('/api/account/me', authenticateToken, (req, res) => {
	const user = users.find(u => u.id === req.user.id)
	if (!user) {
		return res.status(404).json({ message: 'User not found' })
	}
	res.json(user)
})

// Маршрут для получения списка всех пользователей с пагинацией
app.get('/api/users', (req, res) => {
	// Получаем параметры страницы и размера
	const page = parseInt(req.query.page) || 1
	const size = parseInt(req.query.size) || 10

	// Рассчитываем начало и конец выборки
	const startIndex = (page - 1) * size
	const endIndex = startIndex + size

	// Получаем нужную часть массива пользователей
	const paginatedUsers = users.slice(startIndex, endIndex)

	// Формируем ответ с информацией о пагинации
	const response = {
		items: paginatedUsers,
		total: users.length,
		page: page,
		size: size,
		pages: Math.ceil(users.length / size),
	}

	res.json(response)
})

// Маршрут для получения списка подписчиков текущего пользователя
app.get('/api/account/subscribers', authenticateToken, (req, res) => {
	// Получаем текущего пользователя из токена
	const currentUser = users.find(u => u.id === req.user.id)

	if (!currentUser) {
		return res.status(404).json({ message: 'User not found' })
	}

	// Извлекаем список подписчиков пользователя
	const subscribers = currentUser.subscribers.map(subscriberId => {
		return users.find(u => u.id === subscriberId)
	})

	// Возвращаем список подписчиков и их количество
	res.json({
		subscriptionsAmount: subscribers.length, // Количество подписчиков
		subscribers: subscribers, // Сами подписчики
	})
})

app.listen(port, () => {
	console.log(`Server is running at http://localhost:${port}`)
})
