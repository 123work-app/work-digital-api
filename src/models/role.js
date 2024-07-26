const db = require('../config/db');

class Role {
	static getAll = async (req, res) => {
		try {
			const result = await db.execute({
				sql: 'SELECT * FROM role',
				args: [],
			});

			const roles = result.rows;

			res.status(200).json(roles);
		} catch (err) {
			console.error(err);
			res.status(500).json({
				message: 'Erro ao buscar cargos no banco de dados.',
				error: err.stack,
			});
		}
	};

	static getId = async (req, res) => {
		try {
			const { name } = req.params;

			const result = await db.execute({
				sql: 'SELECT id FROM role WHERE name = ?',
				args: [name],
			});

			res.status(200).json(result.rows[0].id);
		} catch (err) {
			console.error(err);
			res.status(500).json({
				message: 'Erro ao buscar o cargo no banco de dados.',
				error: err.stack,
			});
		}
	};
}

module.exports = Role;
