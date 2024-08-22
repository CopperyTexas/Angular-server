const mongoose = require('mongoose')
const userSchema = new mongoose.Schema({
	id: String,
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
// Middleware для присвоения id перед сохранением
userSchema.pre('save', function (next) {
	this.id = this._id.toString() // Присваиваем _id в id как строку
	next()
})
module.exports = mongoose.model('User', userSchema)
