const DailyReport = require('../../models/DailyReport');
const ExecutiveSession = require('../../models/ExecutiveSession');
const SupervisorDailyReport = require('../../models/SupervisorDailyReport');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for PDF uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '..', '..', 'uploads', 'daily-reports');
        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Generate unique filename
        const executiveId = req.body.executiveId || 'unknown';
        const date = new Date().toISOString().split('T')[0];
        const timestamp = Date.now();
        const filename = `Daily_Report_${executiveId}_${date}_${timestamp}.pdf`;
        cb(null, filename);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: function (req, file, cb) {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed'), false);
        }
    }
});

// Upload daily report PDF
exports.uploadDailyReport = async (req, res) => {
    try {
        const {
            executiveId,
            executiveName,
            date,
            loginTime,
            logoutTime,
            duration,
            totalCalls,
            sessionId
        } = req.body;

        if (!req.file) {
            return res.status(400).json({ message: 'No PDF file uploaded' });
        }

        // Create daily report record
        const dailyReport = new DailyReport({
            executiveId,
            executiveName,
            date: new Date(date),
            loginTime,
            logoutTime,
            duration,
            totalCalls: parseInt(totalCalls),
            fileName: req.file.filename,
            filePath: req.file.path,
            fileSize: req.file.size,
            sessionId: sessionId || null
        });

        await dailyReport.save();

        console.log(`Daily report uploaded for executive: ${executiveId}, File: ${req.file.filename}`);

        res.status(201).json({
            message: 'Daily report uploaded successfully',
            reportId: dailyReport._id,
            fileName: req.file.filename
        });
    } catch (error) {
        console.error('Error uploading daily report:', error);
        res.status(500).json({ message: 'Failed to upload daily report', error: error.message });
    }
};

// Get all daily reports for supervisors
exports.getDailyReports = async (req, res) => {
    try {
        const { page = 1, limit = 10, search, date } = req.query;
        
        console.log('Executive reports query params:', { page, limit, search, date });
        
        // Build query
        const query = {};
        
        // Universal search - search across executiveId, executiveName, and other fields
        if (search) {
            query.$or = [
                { executiveId: { $regex: search, $options: 'i' } },
                { executiveName: { $regex: search, $options: 'i' } },
                { fileName: { $regex: search, $options: 'i' } }
            ];
        }
        
        if (date) {
            // Handle date filtering more robustly
            const startDate = new Date(date);
            const endDate = new Date(date);
            
            // Set time to start of day for startDate
            startDate.setHours(0, 0, 0, 0);
            // Set time to end of day for endDate
            endDate.setHours(23, 59, 59, 999);
            
            query.date = { 
                $gte: startDate,
                $lte: endDate
            };
        }

        const reports = await DailyReport.find(query)
            .sort({ uploadedAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await DailyReport.countDocuments(query);

        res.json({
            reports: reports.map(report => ({
                _id: report._id,
                executiveId: report.executiveId,
                executiveName: report.executiveName,
                date: report.date,
                loginTime: report.loginTime,
                logoutTime: report.logoutTime,
                duration: report.duration,
                totalCalls: report.totalCalls,
                fileName: report.fileName,
                fileSize: report.fileSize,
                uploadedAt: report.uploadedAt,
                isViewedBySupervisor: report.isViewedBySupervisor,
                supervisorViewedAt: report.supervisorViewedAt
            })),
            total,
            page: parseInt(page),
            pages: Math.ceil(total / limit)
        });
    } catch (error) {
        console.error('Error fetching daily reports:', error);
        res.status(500).json({ message: 'Failed to fetch daily reports', error: error.message });
    }
};

// Download specific daily report PDF
exports.downloadDailyReport = async (req, res) => {
    try {
        const { reportId } = req.params;
        
        const report = await DailyReport.findById(reportId);
        if (!report) {
            return res.status(404).json({ message: 'Report not found' });
        }

        // Check if file exists
        if (!fs.existsSync(report.filePath)) {
            return res.status(404).json({ message: 'PDF file not found on server' });
        }

        // Mark as viewed by supervisor if not already marked
        if (!report.isViewedBySupervisor) {
            report.isViewedBySupervisor = true;
            report.supervisorViewedAt = new Date();
            await report.save();
        }

        // Set headers for PDF download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${report.fileName}"`);
        res.setHeader('Content-Length', report.fileSize);

        // Send file
        const fileStream = fs.createReadStream(report.filePath);
        fileStream.pipe(res);
    } catch (error) {
        console.error('Error downloading daily report:', error);
        res.status(500).json({ message: 'Failed to download report', error: error.message });
    }
};

// Get daily reports summary for dashboard
exports.getDailyReportsSummary = async (req, res) => {
    try {
        const today = new Date();
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

        const todayReports = await DailyReport.find({
            date: { $gte: todayStart, $lt: todayEnd }
        });

        const thisWeekReports = await DailyReport.find({
            date: { $gte: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000) }
        });

        const summary = {
            today: {
                totalReports: todayReports.length,
                totalCalls: todayReports.reduce((sum, report) => sum + report.totalCalls, 0),
                uniqueExecutives: [...new Set(todayReports.map(r => r.executiveId))].length
            },
            thisWeek: {
                totalReports: thisWeekReports.length,
                totalCalls: thisWeekReports.reduce((sum, report) => sum + report.totalCalls, 0),
                uniqueExecutives: [...new Set(thisWeekReports.map(r => r.executiveId))].length
            },
            recentReports: await DailyReport.find()
                .sort({ uploadedAt: -1 })
                .limit(5)
                .select('executiveId executiveName date totalCalls uploadedAt isViewedBySupervisor')
        };

        res.json(summary);
    } catch (error) {
        console.error('Error fetching daily reports summary:', error);
        res.status(500).json({ message: 'Failed to fetch summary', error: error.message });
    }
};

// Middleware for handling file upload
exports.uploadMiddleware = upload.single('pdf');

// Configure multer for supervisor PDF uploads
const supervisorStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '..', '..', 'uploads', 'supervisor-reports');
        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Generate unique filename
        const supervisorId = req.body.supervisorId || 'unknown';
        const date = new Date().toISOString().split('T')[0];
        const timestamp = Date.now();
        const filename = `Supervisor_Report_${supervisorId}_${date}_${timestamp}.pdf`;
        cb(null, filename);
    }
});

const supervisorUpload = multer({
    storage: supervisorStorage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: function (req, file, cb) {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed'), false);
        }
    }
});

// Middleware for supervisor file upload
exports.supervisorUploadMiddleware = supervisorUpload.single('pdf');

// Upload supervisor daily report PDF
exports.uploadSupervisorDailyReport = async (req, res) => {
    try {
        const {
            supervisorId,
            supervisorName,
            date,
            loginTime,
            logoutTime,
            duration,
            totalCallsHandled,
            totalEscalationsResolved,
            sessionId
        } = req.body;

        if (!req.file) {
            return res.status(400).json({ message: 'No PDF file uploaded' });
        }

        const supervisorDailyReport = new SupervisorDailyReport({
            supervisorId,
            supervisorName,
            date: new Date(date),
            loginTime,
            logoutTime,
            duration,
            totalCallsHandled: parseInt(totalCallsHandled),
            totalEscalationsResolved: parseInt(totalEscalationsResolved),
            fileName: req.file.filename,
            filePath: req.file.path,
            fileSize: req.file.size,
            sessionId: sessionId || null
        });

        await supervisorDailyReport.save();

        console.log(`Supervisor daily report uploaded for supervisor: ${supervisorId}, File: ${req.file.filename}`);

        res.status(201).json({
            message: 'Supervisor daily report uploaded successfully',
            reportId: supervisorDailyReport._id,
            fileName: req.file.filename
        });
    } catch (error) {
        console.error('Error uploading supervisor daily report:', error);
        res.status(500).json({ message: 'Failed to upload supervisor daily report', error: error.message });
    }
};

// Get all supervisor daily reports (admin view)
exports.getSupervisorDailyReports = async (req, res) => {
    try {
        const { page = 1, limit = 10, search, date } = req.query;
        
        console.log('Supervisor reports query params:', { page, limit, search, date });
        
        // Build query
        const query = {};
        
        // Universal search - search across supervisorId, supervisorName, and other fields
        if (search) {
            query.$or = [
                { supervisorId: { $regex: search, $options: 'i' } },
                { supervisorName: { $regex: search, $options: 'i' } },
                { fileName: { $regex: search, $options: 'i' } }
            ];
        }
        
        if (date) {
            // Handle date filtering more robustly
            const startDate = new Date(date);
            const endDate = new Date(date);
            
            // Set time to start of day for startDate
            startDate.setHours(0, 0, 0, 0);
            // Set time to end of day for endDate
            endDate.setHours(23, 59, 59, 999);
            
            query.date = { 
                $gte: startDate,
                $lte: endDate
            };
        }

        const reports = await SupervisorDailyReport.find(query)
            .sort({ uploadedAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await SupervisorDailyReport.countDocuments(query);

        res.json({
            reports: reports.map(report => ({
                _id: report._id,
                supervisorId: report.supervisorId,
                supervisorName: report.supervisorName,
                date: report.date,
                loginTime: report.loginTime,
                logoutTime: report.logoutTime,
                duration: report.duration,
                totalCallsHandled: report.totalCallsHandled,
                totalEscalationsResolved: report.totalEscalationsResolved,
                fileName: report.fileName,
                fileSize: report.fileSize,
                uploadedAt: report.uploadedAt,
                isViewedByAdmin: report.isViewedByAdmin,
                adminViewedAt: report.adminViewedAt
            })),
            total,
            page: parseInt(page),
            pages: Math.ceil(total / limit)
        });
    } catch (error) {
        console.error('Error fetching supervisor daily reports:', error);
        res.status(500).json({ message: 'Failed to fetch supervisor daily reports', error: error.message });
    }
};

// Download specific supervisor daily report PDF
exports.downloadSupervisorDailyReport = async (req, res) => {
    try {
        const { reportId } = req.params;
        
        const report = await SupervisorDailyReport.findById(reportId);
        if (!report) {
            return res.status(404).json({ message: 'Report not found' });
        }

        if (!fs.existsSync(report.filePath)) {
            return res.status(404).json({ message: 'PDF file not found on server' });
        }

        // Mark as viewed by admin if not already marked
        if (!report.isViewedByAdmin) {
            report.isViewedByAdmin = true;
            report.adminViewedAt = new Date();
            await report.save();
        }

        // Set headers for PDF download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${report.fileName}"`);
        res.setHeader('Content-Length', report.fileSize);

        // Send file
        const fileStream = fs.createReadStream(report.filePath);
        fileStream.pipe(res);
    } catch (error) {
        console.error('Error downloading supervisor daily report:', error);
        res.status(500).json({ message: 'Failed to download supervisor report', error: error.message });
    }
};

// Get supervisor daily reports summary for dashboard
exports.getSupervisorDailyReportsSummary = async (req, res) => {
    try {
        const today = new Date();
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

        const todayReports = await SupervisorDailyReport.find({
            date: { $gte: todayStart, $lt: todayEnd }
        });

        const thisWeekReports = await SupervisorDailyReport.find({
            date: { $gte: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000) }
        });

        const summary = {
            today: {
                totalReports: todayReports.length,
                totalCallsHandled: todayReports.reduce((sum, report) => sum + report.totalCallsHandled, 0),
                totalEscalationsResolved: todayReports.reduce((sum, report) => sum + report.totalEscalationsResolved, 0),
                uniqueSupervisors: [...new Set(todayReports.map(r => r.supervisorId))].length
            },
            thisWeek: {
                totalReports: thisWeekReports.length,
                totalCallsHandled: thisWeekReports.reduce((sum, report) => sum + report.totalCallsHandled, 0),
                totalEscalationsResolved: thisWeekReports.reduce((sum, report) => sum + report.totalEscalationsResolved, 0),
                uniqueSupervisors: [...new Set(thisWeekReports.map(r => r.supervisorId))].length
            },
            recentReports: await SupervisorDailyReport.find()
                .sort({ uploadedAt: -1 })
                .limit(5)
                .select('supervisorId supervisorName date totalCallsHandled totalEscalationsResolved uploadedAt isViewedByAdmin')
        };

        res.json(summary);
    } catch (error) {
        console.error('Error fetching supervisor daily reports summary:', error);
        res.status(500).json({ message: 'Failed to fetch supervisor summary', error: error.message });
    }
};
