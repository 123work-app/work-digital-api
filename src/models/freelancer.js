const db = require('../config/db');

const Validator = require('../utils/validator');
const Cloud = require('../utils/cloud');

class Freelancer {
	static create = async (req, res) => {
		let { cpf, roles, description, highlights } = req.body;

		if (!cpf || !roles || !description) {
			return res.status(400).json({ message: 'Preencha todos os campos.' });
		}

		try {
			roles = JSON.parse(roles);
			highlights = JSON.parse(highlights || '[]');
			cpf = cpf.replace(/[^\d]/g, '');

			if (!Array.isArray(roles) || !Validator.isArrayOfRoles(roles)) {
				return res.status(400).json({ message: 'Os cargos selecionados são inválidos.', roles });
			}

			if (!req.files || req.files.length === 0) {
				return res.status(400).json({ message: 'Por favor, insira uma foto de perfil.' });
			}

			const userResult = await db.execute({
				sql: 'SELECT id FROM user WHERE cpf = ?',
				args: [cpf],
			});

			if (userResult.rows.length === 0) {
				return res.status(400).json({ message: `Usuário de cpf ${cpf} não encontrado.` });
			}

			const userId = userResult.rows[0].id;

			const selectResult = await db.execute({
				sql: 'SELECT * FROM freelancer WHERE user_id = ?',
				args: [userId],
			});

			if (selectResult.rows.length > 0) {
				return res.status(400).json({ message: 'Perfil de prestador já cadastrado.' });
			}

			const result = await db.execute({
				sql: 'INSERT INTO freelancer (user_id, description) VALUES (?, ?)',
				args: [userId, description],
			});

			let freelancerId = result.lastInsertRowid;
			if (typeof freelancerId === 'bigint') {
				freelancerId = Number(freelancerId);
			}

			for (const roleName of roles) {
				const roleCheckResult = await db.execute({
					sql: 'SELECT id FROM role WHERE name = ?',
					args: [roleName],
				});

				if (roleCheckResult.rows.length === 0) {
					// Rollback the transaction if role is not found
					await db.execute({
						sql: 'DELETE FROM freelancer WHERE id = ?',
						args: [freelancerId],
					});

					return res.status(400).json({ message: `Cargo com nome ${roleName} não encontrado.` });
				}

				const roleId = roleCheckResult.rows[0].id;

				await db.execute({
					sql: 'INSERT INTO freelancer_role (freelancer_id, role_id) VALUES (?, ?)',
					args: [freelancerId, roleId],
				});
			}

			await Cloud.upload(req.files[0].buffer, freelancerId, 'profile-pictures');
			const profilePictureUrl = `https://res.cloudinary.com/dwngturuh/image/upload/profile-pictures/${freelancerId}.jpg`;

			// Handle highlights
			for (const highlight of highlights) {
				const { roleId, imageUrls } = highlight;

				// Insert the highlight
				const highlightResult = await db.execute({
					sql: 'INSERT INTO highlight (freelancer_id, role_id) VALUES (?, ?)',
					args: [freelancerId, roleId],
				});

				let highlightId = highlightResult.lastInsertRowid;
				if (typeof highlightId === 'bigint') {
					highlightId = Number(highlightId);
				}

				// Insert highlight images
				for (const imageUrl of imageUrls) {
					await db.execute({
						sql: 'INSERT INTO highlight_image (highlight_id, image_url) VALUES (?, ?)',
						args: [highlightId, imageUrl],
					});
				}
			}

			res.status(201).json({
				profilePictureUrl,
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

		try {
			let sql = `
				SELECT f.id, u.id as user_id, u.name, u.phone, u.email, u.city, u.state, f.description, GROUP_CONCAT(r.name) as roles
				FROM freelancer f
				JOIN user u ON f.user_id = u.id
				LEFT JOIN freelancer_role fr ON f.id = fr.freelancer_id
				LEFT JOIN role r ON fr.role_id = r.id
			`;

			let args = [];

			if (role && role !== 'any') {
				sql += ` GROUP BY f.id, u.id, u.name, u.phone, u.email, u.city, u.state, f.description
						 HAVING GROUP_CONCAT(r.name) LIKE ?`;
				args = [`%${role}%`];
			} else {
				sql += ` GROUP BY f.id, u.id, u.name, u.phone, u.email, u.city, u.state, f.description`;
			}

			const result = await db.execute({
				sql,
				args,
			});

			const freelancers = result.rows.map((row) => ({
				...row,
				roles: row.roles ? row.roles.split(',') : [],
				profilePictureUrl: `https://res.cloudinary.com/dwngturuh/image/upload/profile-pictures/${row.id}.jpg`,
			}));

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
			const result = await db.execute({
				sql: `SELECT f.id, u.name, u.phone, u.email, u.city, u.state, f.description, GROUP_CONCAT(r.name) as roles
						FROM freelancer f
						JOIN user u ON f.user_id = u.id
						JOIN freelancer_role fr ON f.id = fr.freelancer_id
						JOIN role r ON fr.role_id = r.id
						WHERE f.id = ?
						GROUP BY f.id, u.name, u.phone, u.email, u.city, u.state, f.description`,
				args: [id],
			});

			if (result.rows.length === 0) {
				return res.status(404).json({
					message: `O prestador de id ${id} não foi encontrado no banco de dados.`,
				});
			}

			const freelancer = {
				...result.rows[0],
				roles: result.rows[0].roles ? result.rows[0].roles.split(',') : [],
				profilePictureUrl: `https://res.cloudinary.com/dwngturuh/image/upload/profile-pictures/${id}.jpg`,
			};

			res.status(200).json(freelancer);
		} catch (err) {
			console.error(err);
			res.status(500).json({
				message: 'Erro ao buscar prestador no banco de dados.',
				error: err.stack,
			});
		}
	};

	static deleteOne = async (req, res) => {
		try {
			const { id } = req.params;
			const result = await db.execute({
				sql: 'SELECT * FROM freelancer WHERE id = ?',
				args: [id],
			});

			if (result.rows.length === 0) {
				return res.status(404).json({
					message: `O prestador de ID ${id} não foi encontrado no banco de dados.`,
				});
			}

			await db.execute({
				sql: 'DELETE FROM freelancer WHERE id = ?',
				args: [id],
			});

			// Delete profile picture from Cloudinary (optional, if implemented)

			res.status(200).json({ message: 'Prestador deletado com sucesso!' });
		} catch (err) {
			console.error(err);
			res.status(500).json({
				message: 'Erro ao deletar prestador.',
				error: err.stack,
			});
		}
	};
}

module.exports = Freelancer;
