const express = require('express');
const router = express.Router();
const supervisorController = require('./supervisor.controller');
const authMiddleware = require('../../middleware/auth');

// Get all escalated calls
router.get('/escalated-calls', authMiddleware, supervisorController.getEscalatedCalls);

// Resolve an escalated call
router.put('/escalated-calls/:callId/resolve', authMiddleware, supervisorController.resolveEscalatedCall);

// Reassign escalated call to executive
router.put('/escalated-calls/:callId/assign', authMiddleware, supervisorController.assignEscalatedCall);

// Create supervisor session
router.post('/sessions/create', authMiddleware, supervisorController.createSupervisorSession);

// Get supervisor session history for PDF generation
router.get('/sessions/history/:supervisorId', authMiddleware, supervisorController.getSupervisorSessionHistory);

// End supervisor session
router.post('/sessions/end/:sessionId', authMiddleware, supervisorController.endSupervisorSession);

module.exports = router;
