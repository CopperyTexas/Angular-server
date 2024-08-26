const bcrypt = require('bcryptjs')
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
module.exports = users
