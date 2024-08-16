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
		isActive: true,
		avatar: '',
		subscribers: [2, 3, 4, 5],
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
		isActive: true,
		avatar: 'http://localhost:3000/assets/ironman.png',
		subscribers: [],
	},
	{
		id: 4,
		username: 'user4',
		password: bcrypt.hashSync('789', 10),
		name: 'Max Eisenhardt',
		nickname: 'Magneto',
		description:
			'Using his mighty ability to control magnetic fields, the one called Magneto fights to help mutants replace humans as the worlds dominant species.',
		power: [
			'Control of Elements',
			'Magnetism',
			'Energy Manipulation',
			'Flight',
			'Superhuman Intelligence',
			'Superhuman Speed',
			'Force Field',
		],
		isActive: true,
		avatar: 'http://localhost:3000/assets/magneto.png',
		subscribers: [3],
	},
	{
		id: 5,
		username: 'user5',
		password: bcrypt.hashSync('789', 10),
		name: 'Scott Summers',
		nickname: 'Cyclops',
		description:
			'From a stoic leader of the X-Men to a hardened radical, Cyclops is always true to mutantkind and determined to make Xavier’s dream of peace between mutants and humans a reality.',
		power: [
			'The emission of force rays from the eyes',
			'The psionic field neutralizes the force rays',
			'Intuitive sense of geometry',
			'Natural Leadership Skills',
			'Hand-to-Hand Combat',
			'The ability to heal thanks to lasers',
			'Superhuman Strength',
		],
		isActive: true,
		avatar: 'http://localhost:3000/assets/cyclops.png',
		subscribers: [1],
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

	// Вычисляем количество подписчиков
	const subscriptionsAmount = user.subscribers.length

	// Формируем ответ, включая динамическое поле subscriptionsAmount
	res.json({
		...user,
		subscriptionsAmount: subscriptionsAmount,
	})
})

// Маршрут для получения списка всех пользователей
app.get('/api/users', authenticateToken, (req, res) => {
	// Если у вас должна быть пагинация для списка пользователей, вы можете добавить ее здесь

	// Возвращаем всех пользователей без паролей и чувствительных данных
	const usersList = users.map(user => {
		return {
			id: user.id,
			username: user.username,
			name: user.name,
			nickname: user.nickname,
			description: user.description,
			power: user.power,
			avatar: user.avatar,
			subscriptionsAmount: user.subscribers.length,
			isActive: user.isActive,
		}
	})

	res.json(usersList)
})

// Маршрут для получения списка подписчиков текущего пользователя
app.get('/api/account/subscribers', authenticateToken, (req, res) => {
	// Получаем текущего пользователя из токена
	const currentUser = users.find(u => u.id === req.user.id)

	if (!currentUser) {
		return res.status(404).json({ message: 'User not found' })
	}

	// Получаем параметры пагинации
	const page = parseInt(req.query.page) || 1
	const size = parseInt(req.query.size) || 10

	// Общий список подписчиков
	const totalSubscribers = currentUser.subscribers.length

	// Рассчитываем общее количество страниц
	const totalPages = Math.ceil(totalSubscribers / size)

	// Рассчитываем начало и конец выборки
	const startIndex = (page - 1) * size
	const endIndex = startIndex + size

	// Извлекаем список подписчиков пользователя и форматируем под нужный ответ
	const formattedSubscribers = currentUser.subscribers.map(subscriberId => {
		const subscriber = users.find(u => u.id === subscriberId)
		return {
			id: subscriber.id,
			avatar: subscriber.avatar,
			nickname: subscriber.nickname,
			subscribersAmount: subscriber.subscribers.length,
			firstName: subscriber.name.split(' ')[0] || '',
			lastName: subscriber.name.split(' ')[1] || '',
			isActive: subscriber.isActive,
			power: subscriber.power, // или используйте другое поле, если это не соответствует ожиданиям
			description: subscriber.description,
		}
	})

	// Формируем ответ
	const response = {
		items: formattedSubscribers,
		total: formattedSubscribers.length,
		page: page,
		size: formattedSubscribers.length, // количество подписчиков
		pages: totalPages,
	}

	res.json(response)
})

app.listen(port, () => {
	console.log(`Server is running at http://localhost:${port}`)
})
