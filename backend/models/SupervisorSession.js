const mongoose = require('mongoose');

const supervisorSessionSchema = new mongoose.Schema({
    supervisorId: { type: String, required: true },
    supervisorName: { type: String, required: true },
    loginTime: { type: Date, required: true, default: Date.now },
    logoutTime: { type: Date },
    duration: { type: String },
    totalCallsHandled: { type: Number, default: 0 },
    totalEscalationsResolved: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('SupervisorSession', supervisorSessionSchema);
