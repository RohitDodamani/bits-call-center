const ExecutiveSession = require('../../models/ExecutiveSession');
const Enquiry = require('../../models/Enquiry');

// Start a new session on executive login
exports.startSession = async (req, res) => {
    try {
        const { executiveId, executiveName } = req.body;

        if (!executiveId || !executiveName) {
            return res.status(400).json({ message: 'executiveId and executiveName are required' });
        }

        // Close any existing active sessions for this executive (safety)
        await ExecutiveSession.updateMany(
            { executiveId, isActive: true },
            { $set: { isActive: false, logoutTime: new Date(), duration: 'Auto-closed' } }
        );

        // Create new session
        const session = new ExecutiveSession({
            executiveId,
            executiveName,
            loginTime: new Date(),
            isActive: true,
            totalCalls: 0
        });

        await session.save();

        console.log(`Session started for executive: ${executiveId} (${executiveName})`);

        res.status(201).json({
            sessionId: session._id,
            loginTime: session.loginTime.toLocaleString(),
            message: 'Session started'
        });
    } catch (error) {
        console.error('Error starting session:', error);
        res.status(500).json({ message: 'Failed to start session', error: error.message });
    }
};

// End a session on executive logout
exports.endSession = async (req, res) => {
    try {
        const { id } = req.params;

        const session = await ExecutiveSession.findById(id);
        if (!session) {
            return res.status(404).json({ message: 'Session not found' });
        }

        const logoutTime = new Date();
        const loginTime = new Date(session.loginTime);
        const diffMs = logoutTime.getTime() - loginTime.getTime();
        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        const duration = `${hours}h ${minutes}m`;

        // Count today's calls by this executive
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const totalCalls = await Enquiry.countDocuments({
            executiveId: session.executiveId,
            callNotes: {
                $elemMatch: {
                    executiveId: session.executiveId,
                    date: { $gte: todayStart, $lte: todayEnd }
                }
            }
        });

        session.logoutTime = logoutTime;
        session.duration = duration;
        session.totalCalls = totalCalls;
        session.isActive = false;
        await session.save();

        console.log(`Session ended for executive: ${session.executiveId}, Duration: ${duration}, Calls: ${totalCalls}`);

        res.json({
            sessionId: session._id,
            loginTime: session.loginTime.toLocaleString(),
            logoutTime: session.logoutTime.toLocaleString(),
            duration: session.duration,
            totalCalls: session.totalCalls,
            message: 'Session ended'
        });
    } catch (error) {
        console.error('Error ending session:', error);
        res.status(500).json({ message: 'Failed to end session', error: error.message });
    }
};

// Get active session for an executive (used on page refresh)
exports.getActiveSession = async (req, res) => {
    try {
        const { executiveId } = req.params;

        const session = await ExecutiveSession.findOne({
            executiveId,
            isActive: true
        }).sort({ loginTime: -1 });

        if (!session) {
            return res.json({ session: null, message: 'No active session' });
        }

        res.json({
            session: {
                sessionId: session._id,
                loginTime: session.loginTime.toLocaleString(),
                loginTimeRaw: session.loginTime,
                executiveId: session.executiveId,
                executiveName: session.executiveName,
                isActive: session.isActive
            }
        });
    } catch (error) {
        console.error('Error getting active session:', error);
        res.status(500).json({ message: 'Failed to get session', error: error.message });
    }
};

// Get call history for a session (all students called today)
exports.getSessionHistory = async (req, res) => {
    try {
        const { executiveId } = req.params;

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        // Find all enquiries where this executive added note today
        const enquiries = await Enquiry.find({
            executiveId: executiveId,
            'callNotes.date': { $gte: todayStart, $lte: todayEnd }
        }).sort({ updatedAt: -1 });

        // Format for the frontend report
        const interactions = enquiries.map(enquiry => {
            // Find the notes added by this executive today
            const todayNotes = (enquiry.callNotes || []).filter(n =>
                n.executiveId === executiveId &&
                new Date(n.date) >= todayStart &&
                new Date(n.date) <= todayEnd
            );

            // Get the latest one
            const latestInteraction = todayNotes[todayNotes.length - 1] || {};

            return {
                studentName: `${enquiry.FirstName || ''} ${enquiry.LastName || ''}`.trim(),
                contactNumber: enquiry.ContactNumber || '',
                place: enquiry.Place || '',
                institute: enquiry.InstituteName || '',
                callStatus: latestInteraction.status || enquiry.status,
                callNote: latestInteraction.note || '',
                followupDate: latestInteraction.followupDate,
                preferredTime: latestInteraction.preferredTime,
                callTime: latestInteraction.date ? new Date(latestInteraction.date).toLocaleString() : '',
                allCallNotes: enquiry.callNotes || []
            };
        });

        res.json({ interactions });
    } catch (error) {
        console.error('Error getting session history:', error);
        res.status(500).json({ message: 'Failed to fetch session history', error: error.message });
    }
};
