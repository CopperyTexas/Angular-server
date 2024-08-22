require('dotenv').config()
const mongoose = require('mongoose')
const User = require('./userModel')
const users = require('./users')

mongoose
	.connect('mongodb://localhost:27017/HeroVerse', {
		useNewUrlParser: true,
		useUnifiedTopology: true,
	})
	.then(async () => {
		console.log('Connected to MongoDB')
		try {
			// Преобразуем идентификаторы подписчиков в ObjectId
			users.forEach(user => {
				user.subscribers = user.subscribers.map(
					subscriberId => new mongoose.Types.ObjectId(subscriberId)
				)
			})

			// Удаляем все записи перед миграцией (если нужно)
			await User.deleteMany({})
			console.log('Old users removed.')

			// Импортируем пользователей
			await User.insertMany(users)
			console.log('Users migrated successfully.')

			process.exit() // Завершаем процесс после завершения миграции
		} catch (err) {
			console.error('Error importing users:', err)
			process.exit(1) // Завершаем процесс с ошибкой
		}
	})
	.catch(err => console.error('Could not connect to MongoDB...', err))
