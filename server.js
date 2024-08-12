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

// Простая база данных пользователей
const users = [
	{
		id: 1,
		username: 'user1',
		password: bcrypt.hashSync('password123', 10), // Захешированный пароль
		profileId: 1, // ID профиля
	},
	{
		id: 2,
		username: 'user2',
		password: bcrypt.hashSync('password456', 10),
		profileId: 2,
	},
]

// Массив профилей
const profiles = [
	{
		id: 1,
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
	},
	{
		id: 2,
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
	},
	{
		id: 3,
		name: 'Tony Stark',
		nickname: 'Iron man',
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
		{ id: user.id, username: user.username, profileId: user.profileId },
		JWT_SECRET,
		{ expiresIn: '1h' }
	)
	const refreshToken = jwt.sign(
		{ id: user.id, username: user.username, profileId: user.profileId },
		JWT_SECRET,
		{ expiresIn: '7d' }
	)

	// Возвращаем токены клиенту
	res.json({
		accessToken,
		refreshToken,
	})
})

// Маршрут для получения профилей
app.get('/api/profiles', (req, res) => {
	res.json(profiles)
})

app.listen(port, () => {
	console.log(`Server is running at http://localhost:${port}`)
})
