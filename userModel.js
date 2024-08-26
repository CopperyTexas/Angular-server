const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
	username: String,
	password: String,
	name: String,
	nickname: String,
	description: String,
	power: [String],
	isActive: Boolean,
	avatar: String,
	subscribers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Правильная структура поля
})

module.exports = mongoose.model('User', userSchema)
