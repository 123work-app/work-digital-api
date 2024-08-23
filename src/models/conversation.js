const db = require('../config/db');

class Conversation {
	static create = async (req, res) => {
		const { user_id, freelancer_id } = req.body;

		if (!user_id || !freelancer_id) {
			return res.status(400).json({ message: 'User ID and Freelancer ID are required.' });
		}

		try {
			const existingConversation = await db.execute({
				sql: `SELECT * FROM conversation WHERE user_id = ? AND freelancer_id = ?`,
				args: [user_id, freelancer_id],
			});

			if (existingConversation.rows.length > 0) {
				const conversationId = existingConversation.rows[0].id;
				return res.status(200).json({ message: 'Conversation already exists.', conversationId });
			}

			const result = await db.execute({
				sql: `INSERT INTO conversation (user_id, freelancer_id) VALUES (?, ?)`,
				args: [user_id, freelancer_id],
			});

			let conversationId = result.lastInsertRowid;
			if (typeof conversationId === 'bigint') {
				conversationId = Number(conversationId);
			}

			res.status(201).json({ message: 'Conversation created successfully.', conversationId });
		} catch (err) {
			console.error(err);
			res.status(500).json({ message: 'Error creating conversation.', error: err.stack });
		}
	};

	static getAllByUser = async (req, res) => {
		const { user_id } = req.query;

		if (!user_id) {
			return res.status(400).json({ message: 'User ID is required to fetch conversations.' });
		}

		try {
			// Retrieve all conversations for a specific user
			const result = await db.execute({
				sql: `SELECT c.id, c.user_id, c.freelancer_id, u.name AS freelancer_name
                      FROM conversation c
                      JOIN user u ON c.freelancer_id = u.id
                      WHERE c.user_id = ?`,
				args: [user_id],
			});

			res.status(200).json(result.rows);
		} catch (err) {
			console.error(err);
			res.status(500).json({ message: 'Error fetching conversations.', error: err.stack });
		}
	};

	static getAllByFreelancer = async (req, res) => {
		const { freelancer_id } = req.query;

		if (!freelancer_id) {
			return res.status(400).json({ message: 'Freelancer ID is required to fetch conversations.' });
		}

		try {
			// Retrieve all conversations for a specific freelancer
			const result = await db.execute({
				sql: `SELECT c.id, c.user_id, u.name AS user_name, c.freelancer_id
                      FROM conversation c
                      JOIN user u ON c.user_id = u.id
                      WHERE c.freelancer_id = ?`,
				args: [freelancer_id],
			});

			res.status(200).json(result.rows);
		} catch (err) {
			console.error(err);
			res.status(500).json({ message: 'Error fetching conversations.', error: err.stack });
		}
	};

	static getOne = async (req, res) => {
		const { id } = req.params;

		try {
			// Fetch conversation details with freelancer_name
			const convoResult = await db.execute({
				sql: `
              SELECT c.id, c.user_id, c.freelancer_id, u.name AS freelancer_name
              FROM conversation c
              JOIN user u ON c.freelancer_id = u.id
              WHERE c.id = ?
            `,
				args: [id],
			});

			if (convoResult.rows.length === 0) {
				return res.status(404).json({ message: 'Conversation not found.' });
			}

			const conversation = convoResult.rows[0];

			// Fetch messages for the conversation
			const messagesResult = await db.execute({
				sql: `SELECT * FROM message WHERE conversation_id = ? ORDER BY timestamp ASC`,
				args: [id],
			});

			res.status(200).json({
				conversation,
				messages: messagesResult.rows,
			});
		} catch (err) {
			console.error(err);
			res.status(500).json({ message: 'Error fetching conversation.', error: err.stack });
		}
	};

	static deleteOne = async (req, res) => {
		const { id } = req.params;

		if (!id) {
			return res.status(400).json({ message: 'Conversation ID is required.' });
		}

		try {
			// Delete a specific conversation by its ID
			await db.execute({
				sql: `DELETE FROM conversation WHERE id = ?`,
				args: [id],
			});

			res.status(200).json({ message: 'Conversation deleted successfully.' });
		} catch (err) {
			console.error(err);
			res.status(500).json({ message: 'Error deleting conversation.', error: err.stack });
		}
	};
}

module.exports = Conversation;
