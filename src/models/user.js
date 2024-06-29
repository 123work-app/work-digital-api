const _ = require('lodash');

const db = require('../db');

class User {
	static async getAll(req, res) {
		try {
			const data = await db.execute('SELECT * FROM user');
			const users = data.rows.map((row) =>
				_.zipObject(data.columns, row)
			);
			res.status(200).json(users);
		} catch (err) {
			res.status(500).json(err);
		}
	}

	static async getOne(req, res) {
		try {
			const { id } = req.params;

			const data = await db.execute({
				sql: 'SELECT * FROM user WHERE id = ?',
				args: [id],
			});

			if (data.rows.length === 0) {
				return res.status(404).json({
					message: 'O usuário não foi encontrado no banco de dados.',
				});
			}

			const user = _.zipObject(data.columns, data.rows[0]);

			res.status(200).json(user);
		} catch (err) {
			res.status(500).json({ message: err.message, stack: err.stack });
		}
	}
}

module.exports = User;
