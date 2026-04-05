const mongoose = require('mongoose');

const DistrictSchema = new mongoose.Schema({
    name: { type: String, required: true },
    state: { type: mongoose.Schema.Types.ObjectId, ref: 'State', required: true },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Ensure unique district name per state
DistrictSchema.index({ name: 1, state: 1 }, { unique: true });

module.exports = mongoose.model('District', DistrictSchema);
