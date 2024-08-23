const express = require('express');
const router = express.Router();

const Conversation = require('../models/conversation');

router.post('/', Conversation.create);
router.get('/', (req, res) => {
	const { user_id, freelancer_id } = req.query;

	if (user_id) {
		return Conversation.getAllByUser(req, res);
	}

	if (freelancer_id) {
		return Conversation.getAllByFreelancer(req, res);
	}

	return res.status(400).json({ message: 'Either user_id or freelancer_id is required to fetch conversations.' });
});
router.delete('/:id', Conversation.deleteOne);

module.exports = router;
