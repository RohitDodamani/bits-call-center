const express = require('express');
const router = express.Router();
const enquiryController = require('./enquiry.controller');
const multer = require('multer');

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            'text/csv',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only CSV, XLS, and XLSX files are allowed.'));
        }
    },
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

router.post('/submit', enquiryController.submitEnquiry);
router.post('/submit-agent', enquiryController.submitAgentEnquiry);
router.post('/upload', upload.single('file'), enquiryController.uploadEnquiryFile);
router.post('/verify', enquiryController.verifyOTP);
router.get('/', enquiryController.getEnquiries);
router.get('/export', enquiryController.exportEnquiries);
router.post('/assign', enquiryController.assignEnquiry);
router.post('/:id/note', enquiryController.logCallNote);
router.get('/analytics', enquiryController.getDashboardAnalytics);

// New route for fetching enquiries by executive ID
router.get('/executive/:executiveId', enquiryController.getEnquiriesByExecutive);

module.exports = router;
