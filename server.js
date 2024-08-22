require('dotenv').config()
const express = require('express')
const cors = require('cors')
const path = require('path')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const User = require('./userModel')

const app = express()
const port = 3000

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

const JWT_SECRET = process.env.JWT_SECRET
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET

if (!JWT_SECRET || !JWT_REFRESH_SECRET) {
	console.error(
		'JWT_SECRET and JWT_REFRESH_SECRET must be set in the environment variables'
	)
	process.exit(1)
}

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

app.listen(port, () => {
	console.log(`Server is running at http://localhost:${port}`)
})
