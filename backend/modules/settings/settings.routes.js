const express = require('express');
const router = express.Router();
const settingsController = require('./settings.controller');

router.get('/', settingsController.getSettings);
router.put('/', settingsController.uploadMiddleware, settingsController.updateSettings);

module.exports = router;
