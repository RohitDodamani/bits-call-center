const express = require('express');
const router = express.Router();
const sessionController = require('./session.controller');

// Start a new session (on login)
router.post('/start', sessionController.startSession);

// End a session (on logout)
router.put('/:id/end', sessionController.endSession);

// Get active session for an executive (on page refresh)
router.get('/active/:executiveId', sessionController.getActiveSession);

// Get session history (all students called today)
router.get('/history/:executiveId', sessionController.getSessionHistory);

module.exports = router;
