const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

const Validator = require('../utils/validator');

class User {
	static create = async (req, res) => {
		const { name, email, password, cpf, state, city, neighborhood, street, number, phone, birthdate } = req.body;

		if (
			!name ||
			!email ||
			!password ||
			!cpf ||
			!state ||
			!city ||
			!neighborhood ||
			!street ||
			!number ||
			!phone ||
			!birthdate
		) {
			return res.status(400).json({ message: 'Preencha todos os campos.' });
		}

		if (!Validator.isCPF(cpf)) {
			return res.status(400).json({ message: 'O CPF inserido é inválido.' });
		}

		// Sanitize input
		cpf = cpf.replace(/[^\d]/g, '');

		try {
			const existingUser = await db.execute({
				sql: 'SELECT * FROM user WHERE email = ? OR cpf = ?',
				args: [email, cpf],
			});
			if (existingUser.rows.length > 0) {
				return res.status(400).json({ message: 'E-mail ou CPF já cadastrados.' });
			}

			const hashedPassword = await bcrypt.hash(password, 10);

			await db.execute({
				sql: 'INSERT INTO user (name, email, password, cpf, state, city, neighborhood, street, number, phone, birthdate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
				args: [name, email, hashedPassword, cpf, state, city, neighborhood, street, number, phone, birthdate],
			});

			res.status(201).json({
				message: 'Usuário cadastrado com sucesso.',
			});
		} catch (err) {
			console.error(err);
			res.status(500).json({
				message: 'Um erro ocorreu durante o cadastro do usuário.',
				error: err.stack,
			});
		}
	};

	static auth = async (req, res) => {
		const { email, password } = req.body;

		if (!email || !password) {
			return res.status(400).json({ message: 'Preencha ambos os campos.' });
		}

		try {
			const result = await db.execute({
				sql: 'SELECT * FROM user WHERE email = ?',
				args: [email],
			});
			const user = result.rows[0];

			if (!user) {
				return res.status(400).json({ message: 'E-mail ou senha inválidos.' });
			}

			const isPasswordValid = await bcrypt.compare(password, user.password);
			if (!isPasswordValid) {
				return res.status(400).json({ message: 'E-mail ou senha inválidos.' });
			}

			const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });

			res.status(200).json({ token, user });
		} catch (err) {
			console.error(err);
			res.status(500).json({
				message: 'Um erro ocorreu durante a autenticação.',
				error: err.stack,
			});
		}
	};

	static getAll = async (req, res) => {
		try {
			const result = await db.execute({
				sql: 'SELECT * FROM user',
				args: [],
			});

			const users = result.rows;

			res.status(200).json(users);
		} catch (err) {
			console.error(err);
			res.status(500).json({
				message: 'Erro ao buscar usuários no banco de dados.',
				error: err.stack,
			});
		}
	};

	static getOne = async (req, res) => {
		const { id } = req.params;

		try {
			const result = await db.execute({
				sql: 'SELECT * FROM user WHERE id = ?',
				args: [id],
			});

			if (result.rows.length === 0) {
				return res.status(404).json({
					message: `O usuário de ID ${id} não foi encontrado no banco de dados.`,
				});
			}

			const user = result.rows[0];

			res.status(200).json(user);
		} catch (err) {
			console.error(err);
			res.status(500).json({
				message: 'Erro ao recuperar dados do usuário',
				error: err.stack,
			});
		}
	};

	static deleteOne = async (req, res) => {
		try {
			const { id } = req.params;
			const result = await db.execute({
				sql: 'SELECT * FROM user WHERE id = ?',
				args: [id],
			});

			if (result.rows.length === 0) {
				return res.status(404).json({
					message: `O usuário de ID ${id} não foi encontrado no banco de dados.`,
				});
			}

			await db.execute({
				sql: 'DELETE FROM user WHERE id = ?',
				args: [id],
			});

			res.status(200).json({ message: 'Usuário deletado com sucesso!', user: result.rows[0] });
		} catch (err) {
			console.error(err);
			res.status(500).json({
				message: 'Erro ao deletar usuário.',
				error: err.stack,
			});
		}
	};
}

module.exports = User;
