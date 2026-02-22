const express = require('express');
const router = express.Router();
const authController = require('./auth.controller');

router.post('/login', authController.login);
router.post('/create-executive', authController.createExecutiveUser);
router.post('/forgot-password', authController.forgotPassword);

module.exports = router;
