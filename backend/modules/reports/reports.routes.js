const express = require('express');
const router = express.Router();
const reportsController = require('./reports.controller');
const authMiddleware = require('../../middleware/auth');

// Upload daily report PDF (executive logout)
router.post('/daily-reports/upload', authMiddleware, reportsController.uploadMiddleware, reportsController.uploadDailyReport);

// Get all daily reports (supervisor view)
router.get('/daily-reports', authMiddleware, reportsController.getDailyReports);

// Download specific daily report PDF
router.get('/daily-reports/:reportId/download', authMiddleware, reportsController.downloadDailyReport);

// Get daily reports summary for dashboard
router.get('/daily-reports/summary', authMiddleware, reportsController.getDailyReportsSummary);

// Upload supervisor daily report PDF (supervisor logout)
router.post('/supervisor-reports/upload', authMiddleware, reportsController.supervisorUploadMiddleware, reportsController.uploadSupervisorDailyReport);

// Get all supervisor daily reports (admin view)
router.get('/supervisor-reports', authMiddleware, reportsController.getSupervisorDailyReports);

// Download specific supervisor daily report PDF
router.get('/supervisor-reports/:reportId/download', authMiddleware, reportsController.downloadSupervisorDailyReport);

// Get supervisor daily reports summary for dashboard
router.get('/supervisor-reports/summary', authMiddleware, reportsController.getSupervisorDailyReportsSummary);

module.exports = router;
