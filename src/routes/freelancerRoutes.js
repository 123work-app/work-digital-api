const express = require('express');
const router = express.Router();

const Freelancer = require('../models/freelancer');

router.post('/', Freelancer.create);
router.get('/', Freelancer.getAll);
router.get('/:id', Freelancer.getOne);

module.exports = router;
