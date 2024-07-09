const db = require('../config/db');
const _ = require('lodash');

const Validator = require('../utils/validator');

class Freelancer {
	static create = async (req, res) => {
		const { userId, role, description, profilePicture, pictureFolder } = req.body;

		if (!userId || !role || !description) {
			return res.status(400).json({ message: 'Preencha todos os campos.' });
		}

		if (!Validator.isRole(role)) {
			return res.status(400).json({ message: 'O cargo selecionado é inválido.' });
		}

		try {
			const existingUser = await db.execute({
				sql: 'SELECT * FROM freelancer WHERE user_id = ?',
				args: [userId],
			});

			if (existingUser.rows.length > 0) {
				return res.status(400).json({
					message: 'Perfil de prestador já cadastrado.',
				});
			}

			await db.execute({
				sql: 'INSERT INTO freelancer (user_id, role, description, profile_picture, picture_folder) VALUES (?, ?, ?, ?, ?)',
				args: [userId, role, description, profilePicture || null, pictureFolder || null],
			});

			res.status(201).json({
				message: 'Prestador cadastrado com sucesso.',
			});
		} catch (err) {
			console.error(err);
			res.status(500).json({
				message: 'Um erro ocorreu durante o cadastro do prestador.',
				error: err.stack,
			});
		}
	};

	static getAll = async (req, res) => {
		const { role } = req.query;

		if (!role) {
			return res.status(400).json({ message: 'Por favor, selecione um cargo para buscar prestadores.' });
		}

		try {
			const data = await db.execute({
				sql: `	SELECT f.id, f.role, u.name, u.phone, u.email, u.city, u.state, f.description, f.profile_picture, f.picture_folder
						FROM freelancer f
						JOIN user u
						ON f.user_id = u.id
						WHERE role = ?;`,
				args: [role],
			});

			const freelancers = data.rows.map((row) => _.zipObject(data.columns, row));

			res.status(200).json(freelancers);
		} catch (err) {
			console.error(err);
			res.status(500).json({
				message: 'Erro ao buscar prestadores no banco de dados.',
				error: err.stack,
			});
		}
	};

	static getOne = async (req, res) => {
		const { id } = req.params;

		try {
			const data = await db.execute({
				sql: `	SELECT f.id, f.role, u.name, u.phone, u.email, u.city, u.state, f.description, f.profile_picture, f.picture_folder
						FROM freelancer f
						JOIN user u
						ON f.user_id = u.id
						WHERE f.id = ?;`,
				args: [id],
			});

			if (data.rows.length === 0) {
				return res.status(404).json({
					message: `O prestador de id ${id} não foi encontrado no banco de dados.`,
				});
			}

			const freelancer = _.zipObject(data.columns, data.rows[0]);

			res.status(200).json(freelancer);
		} catch (err) {
			console.error(err);
			res.status(500).json({
				message: 'Erro ao buscar prestador no banco de dados.',
				error: err.stack,
			});
		}
	};
}

module.exports = Freelancer;
