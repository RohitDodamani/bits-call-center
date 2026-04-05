const mongoose = require('mongoose');

const executiveSessionSchema = new mongoose.Schema({
    executiveId: { type: String, required: true },
    executiveName: { type: String, required: true },
    loginTime: { type: Date, required: true, default: Date.now },
    logoutTime: { type: Date },
    duration: { type: String },
    totalCalls: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('ExecutiveSession', executiveSessionSchema);
