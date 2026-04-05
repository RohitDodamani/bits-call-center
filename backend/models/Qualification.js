const mongoose = require('mongoose');

const QualificationSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Qualification', QualificationSchema);
