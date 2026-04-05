const Enquiry = require('../../models/Enquiry');
const SupervisorSession = require('../../models/SupervisorSession');

exports.getEscalatedCalls = async (req, res) => {
    try {
        // Get the logged-in supervisor's ID from the JWT token
        const supervisorId = req.userData.supervisorId || req.userData.userId;
        
        // Find enquiries with escalated status or with escalated call notes assigned to this supervisor
        const escalatedCalls = await Enquiry.find({
            $or: [
                { 'callNotes.status': 'escalated', 'callNotes.supervisorId': supervisorId },
                { status: 'escalated', supervisorId: supervisorId }
            ]
        })
        .populate('executiveId', 'name email')
        .sort({ updatedAt: -1 });

        // Format the response
        const formattedCalls = escalatedCalls.map(enquiry => {
            const escalatedNotes = enquiry.callNotes.filter(note => 
                note.status === 'escalated' && 
                (note.supervisorId === supervisorId || enquiry.supervisorId === supervisorId)
            );
            const latestEscalatedNote = escalatedNotes[escalatedNotes.length - 1];
            
            return {
                _id: enquiry._id,
                FirstName: enquiry.FirstName,
                LastName: enquiry.LastName,
                ContactNumber: enquiry.ContactNumber,
                EmailId: enquiry.EmailId,
                InstituteName: enquiry.InstituteName,
                executiveId: enquiry.executiveId?.name || 'Not Assigned',
                escalationReason: latestEscalatedNote?.note || 'Customer requested supervisor',
                escalatedDate: latestEscalatedNote?.date || enquiry.updatedAt,
                status: enquiry.status === 'resolved' ? 'resolved' : 'escalated',
                resolvedDate: enquiry.resolvedDate,
                callNotes: enquiry.callNotes,
                leadStatus: latestEscalatedNote?.leadStatus || ''
            };
        });

        res.json({
            escalatedCalls: formattedCalls,
            total: formattedCalls.length
        });
    } catch (error) {
        console.error('Error fetching escalated calls:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.resolveEscalatedCall = async (req, res) => {
    try {
        const { callId } = req.params;
        
        // Update the enquiry status to resolved
        const enquiry = await Enquiry.findByIdAndUpdate(
            callId,
            { 
                status: 'resolved',
                resolvedDate: new Date()
            },
            { new: true }
        );

        if (!enquiry) {
            return res.status(404).json({ message: 'Enquiry not found' });
        }

        // Add a resolved call note
        enquiry.callNotes.push({
            status: 'resolved',
            note: 'Issue resolved by supervisor',
            date: new Date(),
            resolvedBy: req.user?.username || 'Supervisor'
        });

        await enquiry.save();

        res.json({
            message: 'Call marked as resolved successfully',
            resolvedDate: enquiry.resolvedDate
        });
    } catch (error) {
        console.error('Error resolving escalated call:', error);
        res.status(500).json({ message: error.message });
    }
};

// Get supervisor session history for PDF generation
exports.getSupervisorSessionHistory = async (req, res) => {
    try {
        const { supervisorId } = req.params;
        
        // Find the latest active session for this supervisor
        const activeSession = await SupervisorSession.findOne({
            supervisorId: supervisorId,
            isActive: true
        }).sort({ loginTime: -1 });

        if (!activeSession) {
            return res.json({ resolvedEscalations: [] });
        }

        // Get resolved escalations for this session period
        const resolvedEscalations = await Enquiry.find({
            'callNotes.status': 'resolved',
            'callNotes.supervisorId': supervisorId,
            'callNotes.date': { $gte: activeSession.loginTime }
        }).populate('executiveId', 'name')
        .sort({ 'callNotes.date': -1 });

        res.json({
            resolvedEscalations: resolvedEscalations.map(enquiry => {
                const resolvedNotes = enquiry.callNotes.filter(note => 
                    note.status === 'resolved' && 
                    note.supervisorId === supervisorId
                );
                const latestResolvedNote = resolvedNotes[resolvedNotes.length - 1];
                
                return {
                    executiveName: enquiry.executiveId?.name || 'N/A',
                    studentName: `${enquiry.FirstName} ${enquiry.LastName}`,
                    issue: latestResolvedNote?.note || 'N/A',
                    resolutionTime: latestResolvedNote?.date || 'N/A',
                    status: 'Resolved'
                };
            })
        });
    } catch (error) {
        console.error('Error fetching supervisor session history:', error);
        res.status(500).json({ message: error.message });
    }
};

// End supervisor session
exports.endSupervisorSession = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const logoutTime = new Date();
        
        // Calculate duration
        const session = await SupervisorSession.findById(sessionId);
        let duration = 'N/A';
        if (session && session.loginTime) {
            const diffMs = logoutTime - session.loginTime;
            const hours = Math.floor(diffMs / (1000 * 60 * 60));
            const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
            duration = `${hours}h ${minutes}m`;
        }

        // Update session
        const updatedSession = await SupervisorSession.findByIdAndUpdate(
            sessionId,
            {
                logoutTime: logoutTime,
                duration: duration,
                isActive: false,
                totalEscalationsResolved: session?.totalEscalationsResolved || 0
            },
            { new: true }
        );

        res.json({
            loginTime: updatedSession.loginTime,
            logoutTime: logoutTime,
            duration: duration,
            totalEscalationsResolved: session?.totalEscalationsResolved || 0
        });
    } catch (error) {
        console.error('Error ending supervisor session:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.assignEscalatedCall = async (req, res) => {
    try {
        const { callId } = req.params;
        const { executiveId } = req.body;

        // Find executive to get their details
        const Executive = require('../../models/Executive');
        const executive = await Executive.findOne({ id: executiveId });
        
        if (!executive) {
            return res.status(404).json({ message: 'Executive not found' });
        }

        // Update the enquiry with new executive and reset status
        const enquiry = await Enquiry.findByIdAndUpdate(
            callId,
            { 
                executiveId: executive._id,
                status: 'pending' // Reset to pending for reassignment
            },
            { new: true }
        );

        if (!enquiry) {
            return res.status(404).json({ message: 'Enquiry not found' });
        }

        // Add a reassignment call note
        enquiry.callNotes.push({
            status: 'reassigned',
            note: `Reassigned to executive ${executiveId} by supervisor`,
            date: new Date(),
            reassignedBy: req.user?.username || 'Supervisor'
        });

        await enquiry.save();

        res.json({
            message: 'Call reassigned successfully',
            newExecutiveId: executiveId
        });
    } catch (error) {
        console.error('Error reassigning escalated call:', error);
        res.status(500).json({ message: error.message });
    }
};

// Create supervisor session on login
exports.createSupervisorSession = async (req, res) => {
    try {
        const { supervisorId, supervisorName, loginTime } = req.body;

        // Create new supervisor session
        const newSession = new SupervisorSession({
            supervisorId,
            supervisorName,
            loginTime: new Date(loginTime),
            isActive: true
        });

        await newSession.save();

        res.json({
            sessionId: newSession._id,
            loginTime: newSession.loginTime
        });
    } catch (error) {
        console.error('Error creating supervisor session:', error);
        res.status(500).json({ message: error.message });
    }
};
