const express = require('express')
const cors = require('cors')
const path = require('path')
const app = express()
const port = 3000

app.use(cors())
app.use('/assets', express.static(path.join(__dirname, 'assets')))

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
]

app.get('/api/profiles', (req, res) => {
	res.json(profiles)
})

app.listen(port, () => {
	console.log(`Server is running at http://localhost:${port}`)
})
