const express = require('express');
const router = express.Router();
const executiveController = require('./executive.controller');

router.get('/', executiveController.getExecutives);
router.post('/', executiveController.createExecutive);
router.put('/:id', executiveController.updateExecutive);

module.exports = router;
