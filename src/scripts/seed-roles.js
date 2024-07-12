require('dotenv').config();
const db = require('../config/db');
const roles = require('../config/roles.json');

const insertRoles = async () => {
	try {
		let sql = 'INSERT INTO role (name) VALUES ';
		let args = [];

		roles.map((role) => {
			sql += `(?),`;
			args.push(role);
		});

		sql = sql.slice(0, -1);
		sql += ';';
		console.log({ sql, args });

		await db.execute({ sql, args });
	} catch (error) {
		console.error('Error inserting roles:', error);
	}
};

insertRoles();
