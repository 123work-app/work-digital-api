require('dotenv').config();
const db = require('../config/db');

const query = async () => {
	const data = await db.execute('SELECT * FROM user');
	console.log(data.rows[0]);
};

query();
