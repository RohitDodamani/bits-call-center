const express = require('express');
const router = express.Router();
const executiveController = require('./executive.controller');
const authMiddleware = require('../../middleware/auth');

router.get('/', authMiddleware, executiveController.getExecutives);
router.get('/export', authMiddleware, executiveController.exportExecutives);
router.post('/', authMiddleware, executiveController.createExecutive);
router.put('/:id', authMiddleware, executiveController.updateExecutive);

module.exports = router;
