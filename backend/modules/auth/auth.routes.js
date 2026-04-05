const express = require('express');
const router = express.Router();
const authController = require('./auth.controller');
const authMiddleware = require('../../middleware/auth');

// Role-specific login endpoints
router.post('/admin/login', authController.adminLogin);
router.post('/telecaller/login', authController.telecallerLogin);

router.post('/create-executive', authController.createExecutiveUser);
router.post('/create-agent', authController.createAgentUser);
router.post('/create-supervisor', authController.createSupervisorUser);
router.post('/forgot-password', authController.forgotPassword);
router.get('/agents', authMiddleware, authController.getAgents);
router.get('/supervisors', authMiddleware, authController.getSupervisors);
router.get('/supervisors/export', authMiddleware, authController.exportSupervisors);

module.exports = router;
