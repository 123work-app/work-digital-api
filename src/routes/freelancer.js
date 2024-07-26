const express = require('express');
const router = express.Router();
const upload = require('../config/multer');

const Freelancer = require('../models/freelancer');

router.post('/', upload.any(), Freelancer.create);
router.post('/:id/highlights', upload.any(), Freelancer.uploadHighlights);
router.get('/', Freelancer.getAll);
router.get('/:id', Freelancer.getOne);
router.delete('/:id', Freelancer.deleteOne);

module.exports = router;
