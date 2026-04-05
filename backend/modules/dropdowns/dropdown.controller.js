const State = require('../../models/State');
const District = require('../../models/District');
const Place = require('../../models/Place');
const Qualification = require('../../models/Qualification');
const SubQualification = require('../../models/SubQualification');
const Semester = require('../../models/Semester');

// ===============================
// State CRUD
// ===============================
exports.getStates = async (req, res) => {
    try {
        const states = await State.find({ isActive: true });
        res.json(states);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.createState = async (req, res) => {
    try {
        console.log('createState body:', req.body);
        const { name } = req.body;
        if (!name || !name.trim()) {
            return res.status(400).json({ message: 'State name is required' });
        }
        const state = new State({ name: name.trim() });
        const newState = await state.save();
        res.status(201).json(newState);
    } catch (error) {
        console.error('createState error:', error);
        if (error.code === 11000) {
            return res.status(400).json({ message: 'State already exists' });
        }
        res.status(400).json({ message: error.message });
    }
};

exports.updateState = async (req, res) => {
    try {
        const updated = await State.findByIdAndUpdate(req.params.id, { name: req.body.name }, { new: true });
        res.json(updated);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.deleteState = async (req, res) => {
    try {
        await State.findByIdAndDelete(req.params.id);
        res.json({ message: 'State deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ===============================
// District CRUD
// ===============================
exports.getDistricts = async (req, res) => {
    try {
        const query = { isActive: true };
        if (req.query.stateId) query.state = req.query.stateId;
        const districts = await District.find(query).populate('state');
        res.json(districts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.createDistrict = async (req, res) => {
    try {
        const district = new District({ name: req.body.name, state: req.body.stateId });
        const newDistrict = await district.save();
        res.status(201).json(newDistrict);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.updateDistrict = async (req, res) => {
    try {
        const updated = await District.findByIdAndUpdate(req.params.id,
            { name: req.body.name, state: req.body.stateId },
            { new: true }
        );
        res.json(updated);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.deleteDistrict = async (req, res) => {
    try {
        await District.findByIdAndDelete(req.params.id);
        res.json({ message: 'District deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ===============================
// Place CRUD
// ===============================
exports.getPlaces = async (req, res) => {
    try {
        const query = { isActive: true };
        if (req.query.districtId) query.district = req.query.districtId;
        const places = await Place.find(query).populate('district');
        res.json(places);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.createPlace = async (req, res) => {
    try {
        const place = new Place({ name: req.body.name, district: req.body.districtId });
        const newPlace = await place.save();
        res.status(201).json(newPlace);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.updatePlace = async (req, res) => {
    try {
        const updated = await Place.findByIdAndUpdate(req.params.id,
            { name: req.body.name, district: req.body.districtId },
            { new: true }
        );
        res.json(updated);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.deletePlace = async (req, res) => {
    try {
        await Place.findByIdAndDelete(req.params.id);
        res.json({ message: 'Place deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ===============================
// Qualification CRUD
// ===============================
exports.getQualifications = async (req, res) => {
    try {
        const quals = await Qualification.find({ isActive: true });
        res.json(quals);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.createQualification = async (req, res) => {
    try {
        const qual = new Qualification({ name: req.body.name });
        const newQual = await qual.save();
        res.status(201).json(newQual);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.updateQualification = async (req, res) => {
    try {
        const updated = await Qualification.findByIdAndUpdate(req.params.id, { name: req.body.name }, { new: true });
        res.json(updated);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.deleteQualification = async (req, res) => {
    try {
        await Qualification.findByIdAndDelete(req.params.id);
        res.json({ message: 'Qualification deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ===============================
// SubQualification CRUD
// ===============================
exports.getSubQualifications = async (req, res) => {
    try {
        const query = { isActive: true };
        if (req.query.qualificationId) query.qualification = req.query.qualificationId;
        const subQuals = await SubQualification.find(query).populate('qualification');
        res.json(subQuals);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.createSubQualification = async (req, res) => {
    try {
        const subQual = new SubQualification({ name: req.body.name, qualification: req.body.qualificationId });
        const newSubQual = await subQual.save();
        res.status(201).json(newSubQual);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.updateSubQualification = async (req, res) => {
    try {
        const updated = await SubQualification.findByIdAndUpdate(req.params.id,
            { name: req.body.name, qualification: req.body.qualificationId },
            { new: true }
        );
        res.json(updated);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.deleteSubQualification = async (req, res) => {
    try {
        await SubQualification.findByIdAndDelete(req.params.id);
        res.json({ message: 'SubQualification deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ===============================
// Semester CRUD
// ===============================
exports.getSemesters = async (req, res) => {
    try {
        const semesters = await Semester.find({ isActive: true }).sort({ value: 1 });
        res.json(semesters);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.createSemester = async (req, res) => {
    try {
        const semester = new Semester({ name: req.body.name, value: req.body.value });
        const newSemester = await semester.save();
        res.status(201).json(newSemester);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.updateSemester = async (req, res) => {
    try {
        const updated = await Semester.findByIdAndUpdate(req.params.id,
            { name: req.body.name, value: req.body.value },
            { new: true }
        );
        res.json(updated);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.deleteSemester = async (req, res) => {
    try {
        await Semester.findByIdAndDelete(req.params.id);
        res.json({ message: 'Semester deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
