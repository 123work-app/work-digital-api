const db = require('../config/db');

const Validator = require('../utils/validator');
const Cloud = require('../utils/cloud');

class Freelancer {
	static create = async (req, res) => {
		let { cpf, roles, description } = req.body;
		if (!cpf || !roles || !description) {
			return res.status(400).json({ message: 'Preencha todos os campos.' });
		}

		try {
			roles = JSON.parse(roles);
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

			await Cloud.upload(req.files[0].buffer, `${freelancerId}.jpg`, 'profile-pictures');

			res.status(201).json({ message: 'Prestador cadastrado com sucesso.' });
		} catch (err) {
			console.error(err);
			res.status(500).json({
				message: 'Um erro ocorreu durante o cadastro do prestador.',
				error: err.stack,
			});
		}
	};

	static uploadHighlights = async (req, res) => {
		const { id } = req.params;
		const { roleId } = req.body;

		if (!id || !roleId || !Array.isArray(req.files) || req.files.length === 0) {
			return res.status(400).json({ message: 'Insira todas as informações necessárias (id, roleId e imagens).' });
		}

		try {
			// Validate the roleId
			const roleCheckResult = await db.execute({
				sql: 'SELECT id FROM role WHERE id = ?',
				args: [roleId],
			});

			if (roleCheckResult.rows.length === 0) {
				return res.status(400).json({ message: `Cargo com ID ${roleId} não encontrado.` });
			}

			// Create highlight record (only once per roleId)
			const highlightResult = await db.execute({
				sql: 'INSERT INTO highlight (freelancer_id, role_id) VALUES (?, ?)',
				args: [id, roleId],
			});

			let highlightId = highlightResult.lastInsertRowid;
			if (typeof highlightId === 'bigint') {
				highlightId = Number(highlightId);
			}

			// Upload each image and save URL
			for (const highlight of req.files) {
				const { buffer, originalname } = highlight;

				const uploadResult = await Cloud.upload(
					buffer,
					`highlight_${id}_${roleId}_${highlightId}_${originalname}`,
					'highlights'
				);
				const imageUrl = uploadResult.secure_url; // Use secure_url from Cloudinary response

				await db.execute({
					sql: 'INSERT INTO highlight_image (highlight_id, image_url) VALUES (?, ?)',
					args: [highlightId, imageUrl],
				});
			}

			res.status(200).json({ message: 'Destaques atualizados com sucesso.' });
		} catch (err) {
			console.error(err);
			res.status(500).json({
				message: 'Um erro ocorreu ao fazer upload do destaque.',
				error: err.stack,
			});
		}
	};

	static getAll = async (req, res) => {
		const { role } = req.query;

		try {
			// Fetch freelancers with their basic details and roles
			let sql = `
				SELECT f.id, u.id as user_id, u.name, u.phone, u.email, u.city, u.state, f.description, GROUP_CONCAT(r.name) as roles
				FROM freelancer f
				JOIN user u ON f.user_id = u.id
				LEFT JOIN freelancer_role fr ON f.id = fr.freelancer_id
				LEFT JOIN role r ON fr.role_id = r.id
			`;

			const args = [];

			if (role && role !== 'any') {
				sql += `
					GROUP BY f.id, u.id, u.name, u.phone, u.email, u.city, u.state, f.description
					HAVING GROUP_CONCAT(r.name) LIKE ?
				`;
				args.push(`%${role}%`);
			} else {
				sql += `
					GROUP BY f.id, u.id, u.name, u.phone, u.email, u.city, u.state, f.description
				`;
			}

			const freelancerResult = await db.execute({ sql, args });

			const freelancers = await Promise.all(
				freelancerResult.rows.map(async (row) => {
					// Fetch highlights and images for each freelancer
					const highlightsResult = await db.execute({
						sql: `SELECT h.id as highlight_id, h.role_id, r.name as role_name, GROUP_CONCAT(hi.image_url) as image_urls
							FROM highlight h
							JOIN role r ON h.role_id = r.id
							LEFT JOIN highlight_image hi ON h.id = hi.highlight_id
							WHERE h.freelancer_id = ?
							GROUP BY h.id, h.role_id, r.name`,
						args: [row.id],
					});

					const highlights = highlightsResult.rows.map((highlight) => ({
						id: highlight.highlight_id,
						roleId: highlight.role_id,
						roleName: highlight.role_name,
						images: highlight.image_urls ? highlight.image_urls.split(',') : [],
					}));

					return {
						...row,
						roles: row.roles ? row.roles.split(',') : [],
						profilePictureUrl: `https://res.cloudinary.com/dwngturuh/image/upload/profile-pictures/${row.id}.jpg`,
						highlights,
					};
				})
			);

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
			// Fetch freelancer details
			const freelancerResult = await db.execute({
				sql: `SELECT f.id, u.name, u.phone, u.email, u.city, u.state, f.description, GROUP_CONCAT(r.name) as roles
						FROM freelancer f
						JOIN user u ON f.user_id = u.id
						JOIN freelancer_role fr ON f.id = fr.freelancer_id
						JOIN role r ON fr.role_id = r.id
						WHERE f.id = ?
						GROUP BY f.id, u.name, u.phone, u.email, u.city, u.state, f.description`,
				args: [id],
			});

			if (freelancerResult.rows.length === 0) {
				return res.status(404).json({
					message: `O prestador de ID ${id} não foi encontrado no banco de dados.`,
				});
			}

			const freelancer = {
				...freelancerResult.rows[0],
				roles: freelancerResult.rows[0].roles ? freelancerResult.rows[0].roles.split(',') : [],
				profilePictureUrl: `https://res.cloudinary.com/dwngturuh/image/upload/profile-pictures/${id}.jpg`,
			};

			// Fetch highlights and their images
			const highlightsResult = await db.execute({
				sql: `SELECT h.id as highlight_id, h.role_id, r.name as role_name, GROUP_CONCAT(hi.image_url) as image_urls
						FROM highlight h
						JOIN role r ON h.role_id = r.id
						LEFT JOIN highlight_image hi ON h.id = hi.highlight_id
						WHERE h.freelancer_id = ?
						GROUP BY h.id, h.role_id, r.name`,
				args: [id],
			});

			const highlights = highlightsResult.rows.map((highlight) => ({
				id: highlight.highlight_id,
				roleId: highlight.role_id,
				roleName: highlight.role_name,
				images: highlight.image_urls ? highlight.image_urls.split(',') : [],
			}));

			res.status(200).json({
				freelancer,
				highlights,
			});
		} catch (err) {
			console.error(err);
			res.status(500).json({
				message: 'Erro ao buscar prestador no banco de dados.',
				error: err.stack,
			});
		}
	};

	static deleteOne = async (req, res) => {
		const { id } = req.params;

		try {
			// Start a transaction
			const transaction = await db.transaction('write');

			// Check if the freelancer exists
			const freelancerResult = await transaction.execute({
				sql: 'SELECT * FROM freelancer WHERE id = ?',
				args: [id],
			});

			if (freelancerResult.rows.length === 0) {
				await transaction.rollback();
				return res.status(404).json({
					message: `O prestador de ID ${id} não foi encontrado no banco de dados.`,
				});
			}

			// Delete associated highlight images
			await transaction.execute({
				sql: 'DELETE FROM highlight_image WHERE highlight_id IN (SELECT id FROM highlight WHERE freelancer_id = ?)',
				args: [id],
			});

			// Delete associated highlights
			await transaction.execute({
				sql: 'DELETE FROM highlight WHERE freelancer_id = ?',
				args: [id],
			});

			// Delete freelancer roles
			await transaction.execute({
				sql: 'DELETE FROM freelancer_role WHERE freelancer_id = ?',
				args: [id],
			});

			// Delete profile picture from Cloudinary
			// Assuming profile picture URL follows a consistent naming pattern
			await Cloud.delete(`profile-pictures/${id}.jpg`);

			// Delete the freelancer record
			await transaction.execute({
				sql: 'DELETE FROM freelancer WHERE id = ?',
				args: [id],
			});

			// Commit the transaction
			await transaction.commit();

			res.status(200).json({ message: 'Prestador deletado com sucesso!' });
		} catch (err) {
			console.error(err);
			if (transaction) await transaction.rollback();
			res.status(500).json({
				message: 'Erro ao deletar prestador.',
				error: err.stack,
			});
		}
	};
}

module.exports = Freelancer;
