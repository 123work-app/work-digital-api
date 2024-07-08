const express = require('express');
const router = express.Router();

const User = require('../models/user');

router.post('/', User.create);
router.post('/auth', User.auth);
router.get('/', User.getAll);
router.get('/:id', User.getOne);
router.delete('/:id', User.deleteOne);

module.exports = router;
