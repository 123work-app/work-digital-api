const express = require('express');
const router = express.Router();

const Role = require('../models/role');

router.get('/', Role.getAll);
router.get('/:name', Role.getId);

module.exports = router;
