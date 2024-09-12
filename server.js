require('dotenv').config()
const express = require('express')
const cors = require('cors')
const path = require('path')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const User = require('./userModel')
const multer = require('multer')
const sharp = require('sharp')
const fs = require('fs')
const app = express()
const port = 3000

// Настройка multer для хранения файла в памяти
const storage = multer.memoryStorage()
const upload = multer({ storage: storage })

mongoose
	.connect(process.env.MONGO_URI, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
	})
	.then(() => console.log('Connected to MongoDB'))
	.catch(err => console.error('Could not connect to MongoDB...', err))

app.use(cors())
app.use(bodyParser.json())
app.use('/assets', express.static(path.join(__dirname, 'assets')))
app.use(express.json()) // Middleware для обработки JSON-запросов
const JWT_SECRET = process.env.JWT_SECRET
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET

if (!JWT_SECRET || !JWT_REFRESH_SECRET) {
	console.error(
		'JWT_SECRET and JWT_REFRESH_SECRET must be set in the environment variables'
	)
	process.exit(1)
}
// Модель поста
const Post = mongoose.model(
	'Post',
	new mongoose.Schema({
		title: { type: String, required: true },
		content: { type: String, required: true },
		authorId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: true,
		}, // Ссылка на модель пользователя
		createdAt: { type: Date, default: Date.now },
	})
)

// Маршрут для получения всех постов
app.get('/api/post', async (req, res) => {
	try {
		const posts = await Post.find().populate('authorId', 'username avatar') // Подгружаем данные автора
		res.status(200).json(posts) // Возвращаем посты вместе с автором
	} catch (error) {
		res.status(500).json({ message: 'Ошибка при получении постов', error })
	}
})
// Маршрут для получения одного поста по ID
app.get('/api/post/:id', async (req, res) => {
	try {
		const post = await Post.findById(req.params.id).populate(
			'authorId',
			'username avatar'
		)
		if (!post) {
			return res.status(404).json({ message: 'Пост не найден' })
		}
		res.status(200).json(post) // Возвращаем пост с данными автора
	} catch (error) {
		res.status(500).json({ message: 'Ошибка при получении поста', error })
	}
})
// Маршрут для создания поста
app.post('/api/post', async (req, res) => {
	const { title, content, authorId } = req.body

	// Валидация данных
	if (!title || !content || !authorId) {
		return res.status(400).json({ message: 'Все поля обязательны' })
	}

	try {
		// Создание нового поста
		const newPost = new Post({ title, content, authorId })
		await newPost.save()
		res.status(201).json(newPost)
	} catch (error) {
		res.status(500).json({ message: 'Ошибка при создании поста', error })
	}
})

app.post(
	'/api/account/upload_image',
	authenticateToken,
	upload.single('image'),
	async (req, res) => {
		try {
			console.log('Received upload request for avatar')

			if (!req.file) {
				console.error('No file uploaded')
				return res.status(400).json({ message: 'No file uploaded' })
			}

			// Генерация пути для сохранения изображения
			const fileName = `${req.user.username}.png`
			const filePath = path.join(__dirname, 'assets', fileName)

			// Используем sharp для конвертации изображения в PNG и его сохранения
			await sharp(req.file.buffer)
				.resize(300, 300) // Пример изменения размера
				.toFormat('png')
				.toFile(filePath)

			// Обновление ссылки на аватар пользователя в базе данных
			const avatarPath = `http://localhost:3000/assets/${fileName}`
			const user = await User.findByIdAndUpdate(
				req.user.id,
				{ avatar: avatarPath },
				{ new: true }
			)

			if (!user) {
				console.error('Error updating user avatar in database')
				return res.status(500).json({ message: 'Error updating user avatar' })
			}

			console.log('Avatar updated successfully:', avatarPath)
			res.status(200).json(user)
		} catch (err) {
			console.error('Error uploading avatar:', err)
			res.status(500).json({ message: 'Internal Server Error' })
		}
	}
)

app.post('/api/login', async (req, res) => {
	const { username, password } = req.body

	const user = await User.findOne({ username })
	if (!user) {
		return res.status(401).json({ message: 'Invalid credentials' })
	}

	const isPasswordValid = bcrypt.compareSync(password, user.password)
	if (!isPasswordValid) {
		return res.status(401).json({ message: 'Invalid credentials' })
	}

	const accessToken = jwt.sign(
		{ id: user._id, username: user.username },
		JWT_SECRET,
		{ expiresIn: '1d' }
	)
	const refreshToken = jwt.sign(
		{ id: user._id, username: user.username },
		JWT_REFRESH_SECRET,
		{ expiresIn: '7d' }
	)
	console.log('User data:', user)
	res.json({ accessToken, refreshToken })
})

app.post('/api/refresh-token', (req, res) => {
	const { refreshToken } = req.body
	if (!refreshToken) {
		return res.status(401).json({ message: 'Refresh token required' })
	}

	jwt.verify(refreshToken, JWT_REFRESH_SECRET, (err, user) => {
		if (err) {
			return res.status(403).json({ message: 'Invalid refresh token' })
		}

		const accessToken = jwt.sign(
			{ id: user.id, username: user.username },
			JWT_SECRET,
			{ expiresIn: '1m' }
		)
		res.json({ accessToken })
	})
})

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
app.get('/api/account/me', authenticateToken, async (req, res) => {
	const user = await User.findById(req.user.id).populate('subscribers')
	if (!user) {
		return res.status(404).json({ message: 'User not found' })
	}

	res.json(user)
})

app.get('/api/users', authenticateToken, async (req, res) => {
	const users = await User.find({})
	res.json(users)
})
app.post('/api/account/subscribe', authenticateToken, async (req, res) => {
	console.log(
		'Received subscription request for profileId:',
		req.body.profileId
	)
	console.log('Authenticated user:', req.user)

	try {
		const userId = req.user.id // Используем id, а не _id
		const { profileId } = req.body // Идентификатор профиля, на который нужно подписаться

		if (userId === profileId) {
			return res
				.status(400)
				.json({ message: 'You cannot subscribe to yourself' })
		}

		const user = await User.findById(userId)
		if (!user) {
			return res.status(404).json({ message: 'User not found' })
		}

		// Проверяем, подписан ли уже пользователь
		if (user.subscribers.includes(profileId)) {
			return res
				.status(400)
				.json({ message: 'You are already subscribed to this user' })
		}

		// Добавляем подписку
		user.subscribers.push(profileId)
		await user.save()

		res.status(200).json({
			message: 'Successfully subscribed',
			subscribers: user.subscribers,
		})
	} catch (err) {
		console.error('Error subscribing to profile:', err)
		res.status(500).json({ message: 'Internal Server Error' })
	}
})

app.get('/api/account/subscribers', authenticateToken, async (req, res) => {
	try {
		const currentUser = await User.findById(req.user.id).populate('subscribers')
		if (!currentUser) {
			return res.status(404).json({ message: 'User not found' })
		}

		const page = parseInt(req.query.page) || 1
		const size = parseInt(req.query.size) || 10

		const totalSubscribers = currentUser.subscribers.length
		const totalPages = Math.ceil(totalSubscribers / size)
		const startIndex = (page - 1) * size
		const endIndex = startIndex + size

		const formattedSubscribers = currentUser.subscribers.slice(
			startIndex,
			endIndex
		)

		res.json({
			items: formattedSubscribers,
			total: totalSubscribers,
			page,
			size: formattedSubscribers.length,
			pages: totalPages,
		})
	} catch (err) {
		console.error('Error fetching subscribers:', err)
		res.status(500).json({ message: 'Internal Server Error' })
	}
})

app.get('/api/account/:id', authenticateToken, async (req, res) => {
	const user = await User.findById(req.params.id)
	if (!user) {
		return res.status(404).json({ message: 'User not found' })
	}

	res.json(user)
})

app.patch('/api/account/me', authenticateToken, async (req, res) => {
	const updatedData = req.body

	const user = await User.findByIdAndUpdate(req.user.id, updatedData, {
		new: true,
	})
	if (!user) {
		return res.status(404).json({ message: 'User not found' })
	}

	res.json(user)
})
app.get('/api/profiles', async (req, res) => {
	try {
		const { nickname, power } = req.query

		const filter = {}

		if (nickname) {
			filter.nickname = { $regex: nickname, $options: 'i' } // Регулярное выражение для фильтрации по nickname
		}

		if (power) {
			filter.power = { $regex: power, $options: 'i' } // Регулярное выражение для поиска по power, игнорируя регистр и по частям
		}

		const profiles = await User.find(filter) // Используем модель User для поиска профилей
		res.json({ items: profiles })
	} catch (err) {
		console.error('Error fetching profiles:', err) // Логирование ошибки
		res.status(500).json({ message: err.message })
	}
})
app.post('/api/account/unsubscribe', authenticateToken, async (req, res) => {
	try {
		const userId = req.user.id
		const { profileId } = req.body

		if (userId === profileId) {
			return res
				.status(400)
				.json({ message: 'You cannot unsubscribe from yourself' })
		}

		const user = await User.findById(userId)
		if (!user) {
			return res.status(404).json({ message: 'User not found' })
		}

		// Удаляем подписку
		user.subscribers = user.subscribers.filter(
			subId => subId.toString() !== profileId
		)
		await user.save()

		res.status(200).json({
			message: 'Successfully unsubscribed',
			subscribers: user.subscribers,
		})
	} catch (err) {
		console.error('Error unsubscribing from profile:', err)
		res.status(500).json({ message: 'Internal Server Error' })
	}
})

app.listen(port, () => {
	console.log(`Server is running at http://localhost:${port}`)
})
