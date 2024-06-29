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
			res.status(500).json({
				message: 'Erro ao buscar usuários no banco de dados.',
				error: err.stack,
			});
		}
	}

	static async getOne(req, res) {
		try {
			const { id } = req.params;

			const data = await db.execute({
				sql: 'SELECT * FROM user WHERE id = ?',
				args: [id],
			});

			// Check if user exists on database
			if (data.rows.length === 0) {
				return res.status(404).json({
					message: `O usuário de ID ${id} não foi encontrado no banco de dados.`,
				});
			}

			const user = _.zipObject(data.columns, data.rows[0]);

			res.status(200).json(user);
		} catch (err) {
			res.status(500).json({
				message: 'Erro ao recuperar dados do usuário',
				error: err.stack,
			});
		}
	}

	static async create(req, res) {
		try {
			const newUser = req.body;

			const data = await db.execute({
				sql: 'SELECT * FROM user WHERE id = ?',
				args: [newUser.id],
			});

			if (data.rows.length > 0) {
				return res.status(409).json({
					message:
						'Usuário já cadastrado (Verifique se o CPF e/ou E-mail inseridos já não cadastrados).',
				});
			}
		} catch (err) {
			res.status(500).json({
				message: 'Erro ao registrar usuário.',
				error: err.stack,
			});
		}
	}

	static async deleteOne(req, res) {
		try {
			const { id } = req.params;

			const data = await db.execute({
				sql: 'SELECT * FROM user WHERE id = ?',
				args: [id],
			});

			// Check if user exists on database
			if (data.rows.length === 0) {
				return res.status(404).json({
					message: `O usuário de ID ${id} não foi encontrado no banco de dados.`,
				});
			}

			// Delete statement
			await db.execute({
				sql: 'DELETE FROM user WHERE id = ?',
				args: [id],
			});

			res.status(200).json({
				message: 'Usuário deletado com sucesso!',
			});
		} catch (err) {
			res.status(500).json({
				message: 'Erro ao deletar usuário.',
				error: err.stack,
			});
		}
	}
}

module.exports = User;
