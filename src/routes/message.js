const express = require('express');
const router = express.Router();

const Message = require('../models/message');

router.post('/', Message.create);
router.get('/', Message.getAll);
router.delete('/:id', Message.deleteOne);

module.exports = router;
