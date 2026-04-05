const mongoose = require('mongoose');

const SubQualificationSchema = new mongoose.Schema({
    name: { type: String, required: true },
    qualification: { type: mongoose.Schema.Types.ObjectId, ref: 'Qualification', required: true },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Ensure unique sub-qualification name per qualification
SubQualificationSchema.index({ name: 1, qualification: 1 }, { unique: true });

module.exports = mongoose.model('SubQualification', SubQualificationSchema);
