const mongoose = require('mongoose');

const SemesterSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    value: { type: Number, required: true },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Semester', SemesterSchema);
