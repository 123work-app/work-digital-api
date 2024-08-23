const db = require('../config/db');

class Message {
	static create = async (req, res) => {
		const { conversation_id, sender_id, content } = req.body;

		if (!conversation_id || !sender_id || !content) {
			return res.status(400).json({ message: 'Conversation ID, sender ID, and content are required.' });
		}

		try {
			// Insert new message into the message table
			const result = await db.execute({
				sql: `INSERT INTO message (conversation_id, sender_id, content) VALUES (?, ?, ?)`,
				args: [conversation_id, sender_id, content],
			});

			let messageId = result.lastInsertRowid;
			if (typeof messageId === 'bigint') {
				messageId = Number(messageId);
			}

			res.status(201).json({ message: 'Message sent successfully.', messageId });
		} catch (err) {
			console.error(err);
			res.status(500).json({ message: 'Error sending message.', error: err.stack });
		}
	};

	static getAll = async (req, res) => {
		const { conversation_id } = req.query;

		if (!conversation_id) {
			return res.status(400).json({ message: 'Conversation ID is required to fetch messages.' });
		}

		try {
			// Retrieve all messages for a specific conversation
			const result = await db.execute({
				sql: `SELECT m.id, m.sender_id, u.name, m.content, m.timestamp,
                         f.description
                      FROM message m
                      JOIN user u ON m.sender_id = u.id
                      LEFT JOIN freelancer f ON u.id = f.user_id
                      WHERE m.conversation_id = ?
                      ORDER BY m.timestamp ASC`,
				args: [conversation_id],
			});

			res.status(200).json(result.rows);
		} catch (err) {
			console.error(err);
			res.status(500).json({ message: 'Error fetching messages.', error: err.stack });
		}
	};

	static deleteOne = async (req, res) => {
		const { id } = req.params;

		if (!id) {
			return res.status(400).json({ message: 'Message ID is required.' });
		}

		try {
			// Delete a specific message by its ID
			await db.execute({
				sql: `DELETE FROM message WHERE id = ?`,
				args: [id],
			});

			res.status(200).json({ message: 'Message deleted successfully.' });
		} catch (err) {
			console.error(err);
			res.status(500).json({ message: 'Error deleting message.', error: err.stack });
		}
	};
}

module.exports = Message;
