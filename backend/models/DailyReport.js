const mongoose = require('mongoose');
const path = require('path');

const dailyReportSchema = new mongoose.Schema({
    executiveId: { type: String, required: true },
    executiveName: { type: String, required: true },
    date: { type: Date, required: true },
    loginTime: { type: String, required: true },
    logoutTime: { type: String, required: true },
    duration: { type: String, required: true },
    totalCalls: { type: Number, required: true },
    fileName: { type: String, required: true },
    filePath: { type: String, required: true },
    fileSize: { type: Number },
    sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'ExecutiveSession' },
    uploadedAt: { type: Date, default: Date.now },
    isViewedBySupervisor: { type: Boolean, default: false },
    supervisorViewedAt: { type: Date }
}, { timestamps: true });

// Index for efficient queries
dailyReportSchema.index({ executiveId: 1, date: -1 });
dailyReportSchema.index({ date: -1 });
dailyReportSchema.index({ uploadedAt: -1 });

module.exports = mongoose.model('DailyReport', dailyReportSchema);
