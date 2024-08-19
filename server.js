require('dotenv').config() // Подключение переменных окружения из .env

const express = require('express')
const cors = require('cors')
const path = require('path')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const bodyParser = require('body-parser')
const users = require('./users') // Импорт массива пользователей из внешнего файла

const app = express()
const port = 3000

app.use(cors())
app.use(bodyParser.json()) // Для обработки JSON-запросов
app.use('/assets', express.static(path.join(__dirname, 'assets')))

const JWT_SECRET = process.env.JWT_SECRET // Получаем секретный ключ для токенов из переменных окружения
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET // Получаем секретный ключ для рефреш-токенов из переменных окружения

// Проверка наличия переменных среды
if (!JWT_SECRET || !JWT_REFRESH_SECRET) {
	console.error(
		'JWT_SECRET and JWT_REFRESH_SECRET must be set in the environment variables'
	)
	process.exit(1) // Завершаем процесс, если переменные не установлены
}

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
	const currentUser = users.find(u => u.id === req.user.id)

	if (!currentUser) {
		return res.status(404).json({ message: 'User not found' })
	}

	const page = parseInt(req.query.page) || 1
	const size = parseInt(req.query.size) || 10

	const totalSubscribers = currentUser.subscribers.length
	const totalPages = Math.ceil(totalSubscribers / size)
	const startIndex = (page - 1) * size
	const endIndex = startIndex + size

	const formattedSubscribers = currentUser.subscribers
		.slice(startIndex, endIndex)
		.map(subscriberId => users.find(u => u.id === subscriberId))
		.filter(subscriber => subscriber !== undefined)
		.map(subscriber => ({
			id: subscriber.id,
			avatar: subscriber.avatar,
			nickname: subscriber.nickname,
			subscribersAmount: subscriber.subscribers.length,
			firstName: subscriber.name.split(' ')[0] || '',
			lastName: subscriber.name.split(' ')[1] || '',
			isActive: subscriber.isActive,
			power: subscriber.power,
			description: subscriber.description,
		}))

	const response = {
		items: formattedSubscribers,
		total: totalSubscribers,
		page: page,
		size: formattedSubscribers.length,
		pages: totalPages,
	}

	res.json(response)
})
// Маршрут для получения профиля пользователя по ID
app.get('/api/account/:id', authenticateToken, (req, res) => {
	const userId = parseInt(req.params.id, 10) // Получаем ID пользователя из параметров маршрута и приводим к числу

	const user = users.find(u => u.id === userId)
	if (!user) {
		return res.status(404).json({ message: 'User not found' })
	}

	// Формируем ответ без пароля и других чувствительных данных
	const response = {
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

	res.json(response)
})
app.listen(port, () => {
	console.log(`Server is running at http://localhost:${port}`)
})
