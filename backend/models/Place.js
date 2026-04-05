const mongoose = require('mongoose');

const PlaceSchema = new mongoose.Schema({
    name: { type: String, required: true },
    district: { type: mongoose.Schema.Types.ObjectId, ref: 'District', required: true },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Ensure unique place name per district
PlaceSchema.index({ name: 1, district: 1 }, { unique: true });

module.exports = mongoose.model('Place', PlaceSchema);
