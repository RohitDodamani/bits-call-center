const mongoose = require('mongoose');

const supervisorDailyReportSchema = new mongoose.Schema({
    supervisorId: { type: String, required: true },
    supervisorName: { type: String, required: true },
    date: { type: Date, required: true },
    loginTime: { type: String, required: true },
    logoutTime: { type: String, required: true },
    duration: { type: String, required: true },
    totalCallsHandled: { type: Number, required: true },
    totalEscalationsResolved: { type: Number, required: true },
    fileName: { type: String, required: true },
    filePath: { type: String, required: true },
    fileSize: { type: Number },
    sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'SupervisorSession' },
    uploadedAt: { type: Date, default: Date.now },
    isViewedByAdmin: { type: Boolean, default: false },
    adminViewedAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('SupervisorDailyReport', supervisorDailyReportSchema);
