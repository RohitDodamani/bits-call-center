const express = require('express');
const router = express.Router();
const enquiryController = require('./enquiry.controller');

router.post('/submit', enquiryController.submitEnquiry);
router.post('/verify', enquiryController.verifyOTP);
router.get('/', enquiryController.getEnquiries);
router.post('/assign', enquiryController.assignEnquiry);
router.post('/:id/note', enquiryController.logCallNote);

// New route for fetching enquiries by executive ID
router.get('/executive/:executiveId', enquiryController.getEnquiriesByExecutive);

module.exports = router;
