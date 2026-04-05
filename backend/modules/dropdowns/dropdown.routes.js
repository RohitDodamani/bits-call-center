const express = require('express');
const router = express.Router();
const dropdownController = require('./dropdown.controller');

// State Routes
router.get('/states', dropdownController.getStates);
router.post('/states', dropdownController.createState);
router.put('/states/:id', dropdownController.updateState);
router.delete('/states/:id', dropdownController.deleteState);

// District Routes
router.get('/districts', dropdownController.getDistricts);
router.post('/districts', dropdownController.createDistrict);
router.put('/districts/:id', dropdownController.updateDistrict);
router.delete('/districts/:id', dropdownController.deleteDistrict);

// Place Routes
router.get('/places', dropdownController.getPlaces);
router.post('/places', dropdownController.createPlace);
router.put('/places/:id', dropdownController.updatePlace);
router.delete('/places/:id', dropdownController.deletePlace);

// Qualification Routes
router.get('/qualifications', dropdownController.getQualifications);
router.post('/qualifications', dropdownController.createQualification);
router.put('/qualifications/:id', dropdownController.updateQualification);
router.delete('/qualifications/:id', dropdownController.deleteQualification);

// SubQualification Routes
router.get('/sub-qualifications', dropdownController.getSubQualifications);
router.post('/sub-qualifications', dropdownController.createSubQualification);
router.put('/sub-qualifications/:id', dropdownController.updateSubQualification);
router.delete('/sub-qualifications/:id', dropdownController.deleteSubQualification);

// Semester Routes
router.get('/semesters', dropdownController.getSemesters);
router.post('/semesters', dropdownController.createSemester);
router.put('/semesters/:id', dropdownController.updateSemester);
router.delete('/semesters/:id', dropdownController.deleteSemester);

module.exports = router;
