const Enquiry = require('../../models/Enquiry');
const Agent = require('../../models/Agent');
const XLSX = require('xlsx');

// Generate a random 8-character alphanumeric code
const generateOTP = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
};

const ALLOWED_FIELDS = new Set([
    'FirstName',
    'MiddleName',
    'LastName',
    'InstituteName',
    'Qualification',
    'SubQualification',
    'SemesterCompleted',
    'State',
    'District',
    'Place',
    'ContactNumber',
    'EmailId',
    'Gender',
    'course',
    'status',
    'executiveId',
    'isVerified',
    'createdAt',
    'updatedAt',
    '_id'
]);

function normalizeStatus(value) {
    if (value === null || value === undefined) return value;
    const v = String(value).trim().toLowerCase();
    // allow some UI-friendly variants
    if (v === 'no answer' || v === 'noanswer') return 'no_answer';
    if (v === 'follow-up' || v === 'followup') return 'follow-up';
    return v;
}

function buildEnquiryMongoQuery(req) {
    const {
        course,
        status,
        createdFrom,
        createdTo
    } = req.query || {};

    const and = [];

    if (course) {
        const c = String(course).trim();
        if (c) {
            // course can be stored in either `course` or `InstituteName` (legacy)
            and.push({
                $or: [
                    { course: c },
                    { InstituteName: c }
                ]
            });
        }
    }

    if (status) {
        const s = normalizeStatus(status);
        if (s) and.push({ status: s });
    }

    if (createdFrom || createdTo) {
        const range = {};
        if (createdFrom) {
            const d1 = new Date(String(createdFrom));
            if (!Number.isNaN(d1.getTime())) range.$gte = d1;
        }
        if (createdTo) {
            const d2 = new Date(String(createdTo));
            if (!Number.isNaN(d2.getTime())) {
                // include whole day if date-only is provided
                d2.setHours(23, 59, 59, 999);
                range.$lte = d2;
            }
        }
        if (Object.keys(range).length) and.push({ createdAt: range });
    }

    if (and.length === 0) return {};
    if (and.length === 1) return and[0];
    return { $and: and };
}

function transformEnquiry(enquiry) {
    return {
        // Simplified fields for admin dashboard
        studentName: enquiry.FirstName + ' ' + enquiry.LastName,
        email: enquiry.EmailId,
        phone: enquiry.ContactNumber,
        course: enquiry.course || enquiry.InstituteName,

        // Detailed fields for executive dashboard
        FirstName: enquiry.FirstName,
        MiddleName: enquiry.MiddleName,
        LastName: enquiry.LastName,
        InstituteName: enquiry.InstituteName,
        Qualification: enquiry.Qualification,
        SubQualification: enquiry.SubQualification,
        SemesterCompleted: enquiry.SemesterCompleted,
        State: enquiry.State,
        District: enquiry.District,
        Place: enquiry.Place,
        ContactNumber: enquiry.ContactNumber,
        EmailId: enquiry.EmailId,
        Gender: enquiry.Gender,

        // System fields
        _id: enquiry._id,
        status: enquiry.status,
        executiveId: enquiry.executiveId,
        isVerified: enquiry.isVerified,
        otp: enquiry.otp,
        createdAt: enquiry.createdAt,
        callNotes: enquiry.callNotes
    };
}

// exports.submitEnquiry = async (req, res) => {
//     try {
//         const { FirstName, MiddleName, LastName, InstituteName, Qualification, SemesterCompleted, Place, ContactNumber, EmailId, Gender } = req.body;
//         const otp = generateOTP();

//         const enquiry = new Enquiry({
//             FirstName,
//             MiddleName,
//             LastName,
//             InstituteName,
//             Qualification,
//             SemesterCompleted,
//             Place,
//             ContactNumber,
//             EmailId,
//             Gender,
//             otp,
//             status: 'pending'
//         });
// console.log('Enquiry created:', enquiry);
//         const newEnquiry = await enquiry.save();
//         res.status(201).json({
//             message: 'Enquiry submitted successfully',
//             enquiry: {
//                 id: newEnquiry._id,
//                 FirstName: newEnquiry.FirstName,
//                 LastName: newEnquiry.LastName,
//                 otp: newEnquiry.otp
//             }
//         });
//     } catch (error) {
//         res.status(400).json({ message: error.message });
//     }
// };
exports.submitEnquiry = async (req, res) => {
    try {
        // ==========================
        // 1️⃣ Validate Request Body
        // ==========================
        if (!req.body || Object.keys(req.body).length === 0) {
            return res.status(400).json({
                message: 'Request body is empty'
            });
        }

        const {
            FirstName,
            MiddleName,
            LastName,
            InstituteName,
            Qualification,
            SubQualification,
            SemesterCompleted,
            State,
            District,
            Place,
            ContactNumber,
            EmailId,
            Gender,
            course
        } = req.body;

        // ==========================
        // 2️⃣ Required Field Validation
        // ==========================
        if (!FirstName || !LastName || !EmailId || !ContactNumber) {
            return res.status(400).json({
                message: 'Missing required fields'
            });
        }

        // ==========================
        // 3️⃣ Generate OTP
        // ==========================
        const otp = generateOTP();

        // ==========================
        // 4️⃣ Create Enquiry Document
        // ==========================
        const enquiry = new Enquiry({
            FirstName,
            MiddleName,
            LastName,
            InstituteName,
            Qualification,
            SubQualification,
            SemesterCompleted,
            State,
            District,
            Place,
            ContactNumber,
            EmailId,
            Gender,
            course,
            otp,
            status: 'pending'
        });

        console.log('Enquiry Before Save:', enquiry);

        // ==========================
        // 5️⃣ Save To DB
        // ==========================
        const newEnquiry = await enquiry.save();

        // ==========================
        // 6️⃣ Success Response
        // ==========================
        return res.status(201).json({
            message: 'Enquiry submitted successfully',
            enquiry: {
                id: newEnquiry._id,
                FirstName: newEnquiry.FirstName,
                LastName: newEnquiry.LastName,
                otp: newEnquiry.otp
            }
        });

    } catch (error) {
        console.error('Submit Enquiry Error:', error);
        return res.status(500).json({
            message: 'Internal Server Error',
            error: error.message
        });
    }
};
// exports.verifyOTP = async (req, res) => {
//     try {
//         const { id, receivedOtp } = req.body;
//         const enquiry = await Enquiry.findById(id);

//         if (!enquiry) {
//             return res.status(404).json({ message: 'Enquiry not found' });
//         }

//         if (enquiry.otp === receivedOtp) {
//             enquiry.isVerified = true;
//             enquiry.status = 'verified';

//             // Remove auto-assignment - keep as verified without assigning to executive
//             await enquiry.save();
//             res.json({ message: 'OTP verified successfully', enquiry });
//         } else {
//             enquiry.status = 'mismatch';
//             await enquiry.save();
//             res.status(400).json({ message: 'OTP mismatch' });
//         }
//             enquiry.status = 'mismatch';
//             await enquiry.save();
//             res.status(400).json({ message: 'OTP mismatch' });

//     } catch (error) {
//         res.status(400).json({ message: error.message });
//     }
// }
exports.verifyOTP = async (req, res) => {
    try {

        // ==============================
        // 1️⃣ Extract id and OTP
        // ==============================
        const { id, receivedOtp } = req.body;

        // ==============================
        // 2️⃣ Validate Input
        // ==============================
        if (!id || !receivedOtp) {
            return res.status(400).json({
                message: 'ID and OTP are required'
            });
        }

        // ==============================
        // 3️⃣ Find Enquiry
        // ==============================
        const enquiry = await Enquiry.findById(id);

        if (!enquiry) {
            return res.status(404).json({
                message: 'Enquiry not found'
            });
        }

        // ==============================
        // 4️⃣ Compare OTP
        // ==============================
        if (enquiry.otp !== receivedOtp) {
            return res.status(400).json({
                message: 'OTP mismatch'
            });
        }

        // ==============================
        // 5️⃣ Update ONLY isVerified and status
        // ==============================
        enquiry.isVerified = true;
        enquiry.status = 'verified'; // Keep as verified, NOT assigned

        // ❗ DO NOT assign executive - assignment happens on interaction submission

        await enquiry.save();

        // ==============================
        // 6️⃣ Success Response
        // ==============================
        return res.status(200).json({
            message: 'OTP verified successfully',
            enquiry
        });

    } catch (error) {

        console.error('Verify OTP Error:', error);

        return res.status(500).json({
            message: 'Internal Server Error',
            error: error.message
        });
    }
};
exports.getEnquiries = async (req, res) => {
    try {
        const page = req.query?.page ? Number(req.query.page) : undefined;
        const limit = req.query?.limit ? Number(req.query.limit) : undefined;
        const sort = req.query?.sort ? String(req.query.sort) : '-createdAt';

        const query = buildEnquiryMongoQuery(req);

        const sortObj = (() => {
            // allow "-createdAt" / "createdAt"
            const field = sort.startsWith('-') ? sort.slice(1) : sort;
            if (!ALLOWED_FIELDS.has(field)) return { createdAt: -1 };
            return { [field]: sort.startsWith('-') ? -1 : 1 };
        })();

        if (page && limit) {
            const safePage = Number.isFinite(page) && page > 0 ? page : 1;
            const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.min(limit, 200) : 20;
            const skip = (safePage - 1) * safeLimit;

            const [items, total] = await Promise.all([
                Enquiry.find(query).sort(sortObj).skip(skip).limit(safeLimit),
                Enquiry.countDocuments(query)
            ]);

            return res.json({
                items: items.map(transformEnquiry),
                total,
                page: safePage,
                limit: safeLimit
            });
        }

        const enquiries = await Enquiry.find(query).sort(sortObj);
        return res.json(enquiries.map(transformEnquiry));
    } catch (error) {
        const msg = error?.message || 'Failed to fetch enquiries';
        if (msg.toLowerCase().includes('filter')) {
            return res.status(400).json({ message: msg });
        }
        return res.status(500).json({ message: msg });
    }
};

exports.exportEnquiries = async (req, res) => {
    try {
        const sort = req.query?.sort ? String(req.query.sort) : '-createdAt';
        const query = buildEnquiryMongoQuery(req);

        const sortObj = (() => {
            const field = sort.startsWith('-') ? sort.slice(1) : sort;
            if (!ALLOWED_FIELDS.has(field)) return { createdAt: -1 };
            return { [field]: sort.startsWith('-') ? -1 : 1 };
        })();

        const enquiries = await Enquiry.find(query).sort(sortObj);
        const rows = enquiries.map((e) => {
            const t = transformEnquiry(e);
            // flatten for Excel
            return {
                StudentName: t.studentName,
                Email: t.email,
                Phone: t.phone,
                Course: t.course,
                Gender: t.Gender,
                Status: t.status,
                ExecutiveId: t.executiveId || '',
                CreatedAt: t.createdAt ? new Date(t.createdAt).toISOString() : ''
            };
        });

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(rows);
        XLSX.utils.book_append_sheet(wb, ws, 'Enquiries');

        const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

        const dateStr = new Date().toISOString().slice(0, 10);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="enquiries_${dateStr}.xlsx"`);
        return res.status(200).send(buffer);
    } catch (error) {
        const msg = error?.message || 'Failed to export enquiries';
        if (msg.toLowerCase().includes('filter')) {
            return res.status(400).json({ message: msg });
        }
        return res.status(500).json({ message: msg });
    }
};

exports.assignEnquiry = async (req, res) => {
    try {
        const { id, executiveId } = req.body;
        const enquiry = await Enquiry.findById(id);
        if (!enquiry) return res.status(404).json({ message: 'Enquiry not found' });

        enquiry.executiveId = executiveId;
        enquiry.status = 'assigned'; // New status for assignment
        await enquiry.save();
        res.json({ message: 'Enquiry assigned successfully', enquiry });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// exports.logCallNote = async (req, res) => {
//     try {
//         const { id } = req.params;
//         const { note, executiveId, status, followupDate } = req.body;

//         const enquiry = await Enquiry.findById(id);
//         if (!enquiry) return res.status(404).json({ message: 'Enquiry not found' });

//         // Log the interaction
//         enquiry.callNotes.push({ note, executiveId, status, followupDate });
//         enquiry.status = status;

//         await enquiry.save();

//         console.log(`Interaction logged for enquiry ${id} by executive ${executiveId}`);

//         // After successful interaction, assign next verified enquiry to this executive
//         const nextUnassignedEnquiry = await Enquiry.findOne({
//             executiveId: { $in: [null, "", undefined] },
//             status: 'verified'
//         });

//         if (nextUnassignedEnquiry) {
//             console.log(`Found next unassigned verified enquiry: ${nextUnassignedEnquiry._id}, assigning to executive ${executiveId}`);

//             // Assign the next enquiry to this executive
//             nextUnassignedEnquiry.executiveId = executiveId;
//             nextUnassignedEnquiry.status = 'assigned';
//             await nextUnassignedEnquiry.save();

//             console.log(`Successfully assigned next enquiry ${nextUnassignedEnquiry._id} to executive ${executiveId}`);
//         } else {
//             console.log(`No more unassigned verified enquiries available for executive ${executiveId}`);
//         }

//         res.json(enquiry);
//     } catch (error) {
//         console.error('Error in logCallNote:', error);
//         res.status(500).json({ message: error.message });
//     }
// };
exports.logCallNote = async (req, res) => {
    try {

        const { id } = req.params;
        const { note, executiveId, status, followupDate, preferredTime, leadStatus, courseInterested, courseRecommended, fees } = req.body;

        console.log("Incoming Data:", req.body);

        const enquiry = await Enquiry.findById(id);
        if (!enquiry) {
            return res.status(404).json({ message: 'Enquiry not found' });
        }

        // Safe date conversion
        const parsedFollowupDate = followupDate
            ? new Date(followupDate)
            : null;

        // Check if this is an escalated call and assign supervisor
        let supervisorId = null;
        if (status === 'escalated' || (status === 'contacted' && leadStatus === 'hot')) {
            // For now, assign to the first available supervisor
            // In a real implementation, you might want to implement supervisor assignment logic
            const User = require('../../models/User');
            const supervisor = await User.findOne({ role: 'supervisor' });
            if (supervisor) {
                supervisorId = supervisor.supervisorId || supervisor._id.toString();
                enquiry.supervisorId = supervisorId;
            }
        }

        // Push call history
        enquiry.callNotes.push({
            note: note?.trim(),
            executiveId,
            supervisorId,
            status,
            leadStatus,
            followupDate: parsedFollowupDate,
            preferredTime,
            courseInterested,
            courseRecommended,
            fees
        });

        // Update main enquiry state
        enquiry.status = status;
        enquiry.executiveId = executiveId;

        // 🚨 ESCALATION LOGIC: Check if call history exceeds 3 entries
        if (enquiry.callNotes.length > 3) {
            console.log(`🚨 ESCALATION: Enquiry ${id} has ${enquiry.callNotes.length} call notes - escalating to senior`);

            // Mark as escalated
            enquiry.status = 'escalated';
            enquiry.escalatedAt = new Date();
            enquiry.escalatedFrom = executiveId;

            // Assign supervisor if not already assigned
            if (!supervisorId) {
                const User = require('../../models/User'); 
                const supervisor = await User.findOne({ role: 'supervisor' });
                if (supervisor) {
                    supervisorId = supervisor.supervisorId || supervisor._id.toString();
                    enquiry.supervisorId = supervisorId;
                }
            }

            // Add escalation note to call history
            enquiry.callNotes.push({
                note: `🚨 ESCALATED: Call history exceeded 3 entries (${enquiry.callNotes.length} total). Escalated to senior executive.`,
                executiveId: 'SYSTEM',
                supervisorId,
                status: 'escalated',
                followupDate: null,
                preferredTime: null
            });

            console.log(`✅ Enquiry ${id} has been escalated to senior executive`);
        }

        await enquiry.save();

        console.log("Saved Call Notes:", enquiry.callNotes);

        res.json(enquiry);

    } catch (error) {
        console.error('Error in logCallNote:', error);
        res.status(500).json({ message: error.message });
    }
};
// Controller: Get enquiries assigned to specific executive
// exports.getEnquiriesByExecutive = async (req, res) => {
//     try {

//         // 1️⃣ Extract executiveId from route params
//         const { executiveId } = req.params;

//         // 2️⃣ Convert pagination values to numbers (VERY IMPORTANT)
//         const page = parseInt(req.query.page) || 1;
//         const limit = parseInt(req.query.limit) || 10;

//         console.log(`Fetching enquiries for executive: ${executiveId}, page: ${page}, limit: ${limit}`);

//         // 3️⃣ Check if executive already has assigned enquiries
//         // Include both 'assigned' and 'callback' (follow-up cases)
//         const existingAssignedEnquiries = await Enquiry.find({
//             executiveId: executiveId,
//             status: { $in: ['assigned', 'callback'] }
//         });

//         console.log(`Executive ${executiveId} has ${existingAssignedEnquiries.length} active enquiries`);

//         // 4️⃣ If no enquiries at all, assign one verified enquiry
//         if (existingAssignedEnquiries.length === 0) {

//             console.log('No assigned enquiries found, looking for unassigned verified enquiry...');

//             // Only pick enquiries which:
//             // - are verified
//             // - NOT already assigned
//             // - NOT callback
//             const unassignedEnquiry = await Enquiry.findOne({
//                 executiveId: { $in: [null, "", undefined] },
//                 status: 'verified'
//             });

//             if (unassignedEnquiry) {

//                 console.log(`Assigning enquiry ${unassignedEnquiry._id} to executive ${executiveId}`);

//                 // Assign executive
//                 unassignedEnquiry.executiveId = executiveId;

//                 // Change status to assigned
//                 unassignedEnquiry.status = 'assigned';

//                 await unassignedEnquiry.save();

//                 console.log(`Successfully assigned enquiry ${unassignedEnquiry._id}`);

//             } else {
//                 console.log('No unassigned verified enquiries available');
//             }
//         }

//         // 5️⃣ Final Query
//         // This ensures:
//         // ✔ callback is visible only to same executive
//         // ✔ assigned enquiries are visible only to same executive
//         const query = {
//             executiveId: executiveId,
//             status: { $in: ['assigned', 'callback'] }
//         };

//         console.log('Final query:', query);

//         // 6️⃣ Pagination calculation
//         const skipCount = (page - 1) * limit;

//         // 7️⃣ Total count for pagination
//         const totalCount = await Enquiry.countDocuments(query);

//         // 8️⃣ Fetch enquiries with pagination
//         const enquiries = await Enquiry.find(query)
//             .skip(skipCount)
//             .limit(limit)
//             .sort({ createdAt: -1 });

//         console.log(`Returning ${enquiries.length} enquiries`);

//         // 9️⃣ Send response
//         res.json({
//             enquiries,
//             pagination: {
//                 currentPage: page,
//                 totalPages: Math.ceil(totalCount / limit),
//                 hasNext: page * limit < totalCount,
//                 hasPrev: page > 1,
//                 totalCount: totalCount
//             }
//         });

//     } catch (error) {

//         console.error('Error fetching enquiries by executive:', error);

//         res.status(500).json({
//             error: error.message,
//             message: `Failed to fetch enquiries`
//         });
//     }
// };
exports.getEnquiriesByExecutive = async (req, res) => {
    try {

        // 1️⃣ Extract executiveId
        const { executiveId } = req.params;

        // 2️⃣ Pagination values
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        console.log(`Fetching enquiries for executive: ${executiveId}, page: ${page}, limit: ${limit}`);

        // 3️⃣ Check existing currently assigned student
        // An executive should only have ONE 'assigned' student at a time.
        // Callbacks don't count as 'active' for auto-assignment purposes.
        const existingAssignedEnquiries = await Enquiry.find({
            executiveId: executiveId,
            status: 'assigned'
        });

        console.log(`Executive ${executiveId} has ${existingAssignedEnquiries.length} active enquiries`);

        // 4️⃣ Auto-assign if none exists
        if (existingAssignedEnquiries.length === 0) {

            console.log('No active enquiries found, searching for eligible enquiry...');

            const unassignedEnquiry = await Enquiry.findOne({
                isVerified: true,
                escalatedAt: { $exists: false },
                status: { $nin: ['completed', 'escalated'] },
                $or: [
                    { executiveId: { $exists: false } },
                    { executiveId: null },
                    { executiveId: "" }
                ]
            }).sort({ createdAt: 1 });

            if (unassignedEnquiry) {
                unassignedEnquiry.executiveId = executiveId;
                unassignedEnquiry.status = 'assigned';
                await unassignedEnquiry.save();
                console.log(`Assigned enquiry ${unassignedEnquiry._id}`);
            } else {
                console.log('No eligible enquiry found');
            }
        }

        // 5️⃣ Define today's date range
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        // 6️⃣ Fetch all active enquiries
        const activeEnquiries = await Enquiry.find({
            executiveId: executiveId,
            status: { $in: ['assigned', 'callback'] }
        }).sort({ createdAt: 1 });

        // 7️⃣ Separate today's callbacks
        // Check the LATEST call note's followupDate (not any random one)
        const todayCallbacks = activeEnquiries.filter(enquiry => {
            if (enquiry.status !== 'callback') return false;
            if (!enquiry.callNotes || enquiry.callNotes.length === 0) return false;

            // Get the latest call note with a followupDate
            const notesWithFollowup = enquiry.callNotes.filter(n => n.followupDate);
            if (notesWithFollowup.length === 0) return false;

            const latestNote = notesWithFollowup[notesWithFollowup.length - 1];
            const followDate = new Date(latestNote.followupDate);
            return followDate >= todayStart && followDate <= todayEnd;
        });

        console.log(`Today's callbacks: ${todayCallbacks.length}`);

        // 8️⃣ Separate assigned (normal new enquiries)
        const assignedEnquiries = activeEnquiries.filter(
            enquiry => enquiry.status === 'assigned'
        );

        console.log(`Assigned enquiries: ${assignedEnquiries.length}`);

        // 9️⃣ Callbacks with past/future dates are NOT shown
        // They only appear on their specific follow-up date

        // 🔟 Count today's contacted students
        const todayContacted = await Enquiry.countDocuments({
            executiveId: executiveId,
            callNotes: {
                $elemMatch: {
                    executiveId: executiveId,
                    date: { $gte: todayStart, $lte: todayEnd },
                    status: { $nin: ['assigned', 'pending'] }
                }
            }
        });

        console.log(`Today's contacted count: ${todayContacted}`);

        // 1️⃣1️⃣ Final Priority Logic
        // Today's callbacks FIRST (highest priority), then normal assigned
        const finalList = [
            ...todayCallbacks,
            ...assignedEnquiries
        ];

        // 1️⃣2️⃣ Manual pagination
        const totalCount = finalList.length;
        const skipCount = (page - 1) * limit;
        const enquiries = finalList.slice(skipCount, skipCount + limit);

        console.log(`Returning ${enquiries.length} enquiries`);

        res.json({
            enquiries,
            todayContactedCount: todayContacted,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalCount / limit),
                hasNext: page * limit < totalCount,
                hasPrev: page > 1,
                totalCount: totalCount
            }
        });

    } catch (error) {
        console.error('Error fetching enquiries by executive:', error);
        res.status(500).json({
            error: error.message,
            message: 'Failed to fetch enquiries'
        });
    }
};
// exports.getEnquiriesByExecutive = async (req, res) => {
//     try {

//         const { executiveId } = req.params;

//         const page = parseInt(req.query.page) || 1;
//         const limit = parseInt(req.query.limit) || 10;

//         console.log(`Fetching enquiries for executive: ${executiveId}, page: ${page}, limit: ${limit}`);

//         const existingAssignedEnquiries = await Enquiry.find({
//             executiveId: executiveId,
//             status: { $in: ['assigned', 'callback'] }
//         });

//         console.log(`Executive ${executiveId} has ${existingAssignedEnquiries.length} active enquiries`);


//         // 🔥 FOLLOW-UP DATE LOGIC STARTS HERE
// if (existingAssignedEnquiries.length === 0) {

//     console.log('No assigned enquiries found, looking for unassigned verified enquiry...');

//     const unassignedEnquiry = await Enquiry.findOne({
//         isVerified: true,                         // ✅ Use verification flag
//         escalatedAt: { $exists: false },          // ✅ Not escalated
//         status: { $nin: ['completed', 'escalated'] }, // ✅ Not closed
//         $or: [
//             { executiveId: { $exists: false } },  // field not present
//             { executiveId: null },                // explicitly null
//             { executiveId: "" }                   // empty string safety
//         ]
//     }).sort({ createdAt: 1 }); // FIFO assignment

//     if (unassignedEnquiry) {

//         unassignedEnquiry.executiveId = executiveId;
//         unassignedEnquiry.status = 'assigned';

//         await unassignedEnquiry.save();

//         console.log(`Assigned enquiry ${unassignedEnquiry._id}`);

//     } else {
//         console.log('No eligible enquiry found for assignment');
//     }
// }
//         const todayStart = new Date();
//         todayStart.setHours(0, 0, 0, 0);

//         const todayEnd = new Date();
//         todayEnd.setHours(23, 59, 59, 999);

//         const query = {
//             executiveId: executiveId,
//             status: { $ne: 'escalated' }, // Exclude escalated enquiries
//             $or: [
//                 { status: 'assigned' },
//                 {
//                     status: 'callback',
//                     callNotes: {
//                         $elemMatch: {
//                             followupDate: {
//                                 $gte: todayStart,
//                                 $lte: todayEnd
//                             }
//                         }
//                     }
//                 }
//             ]
//         };

//         console.log('Final query:', query);

//         const skipCount = (page - 1) * limit;

//         const totalCount = await Enquiry.countDocuments(query);

//         const enquiries = await Enquiry.find(query)
//             .skip(skipCount)
//             .limit(limit)
//             .sort({ createdAt: -1 });

//         console.log(`Returning ${enquiries.length} enquiries`);

//         res.json({
//             enquiries,
//             pagination: {
//                 currentPage: page,
//                 totalPages: Math.ceil(totalCount / limit),
//                 hasNext: page * limit < totalCount,
//                 hasPrev: page > 1,
//                 totalCount: totalCount
//             }
//         });

//     } catch (error) {
//         console.error('Error fetching enquiries by executive:', error);
//         res.status(500).json({
//             error: error.message,
//             message: `Failed to fetch enquiries`
//         });
//     }
// };

// Agent enquiry submission (no OTP)
exports.submitAgentEnquiry = async (req, res) => {
    try {
        const { FirstName, MiddleName, LastName, InstituteName, Qualification, SubQualification, SemesterCompleted, State, District, Place, ContactNumber, EmailId, Gender, course, agentId } = req.body;

        // Create enquiry without OTP for agent submissions
        const enquiry = new Enquiry({
            FirstName,
            MiddleName,
            LastName,
            InstituteName,
            Qualification,
            SubQualification,
            SemesterCompleted,
            State,
            District,
            Place,
            ContactNumber,
            EmailId,
            Gender,
            course,
            status: 'pending',
            executiveId: null,
            agentId: agentId || null,
            isVerified: true,
            createdAt: new Date()
        });

        await enquiry.save();

        res.status(201).json({
            message: 'Enquiry submitted successfully',
            enquiry: {
                id: enquiry._id,
                studentName: `${FirstName} ${LastName}`,
                email: EmailId,
                phone: ContactNumber,
                status: 'pending'
                // ❌ NO 'otp' field in response
            }
        });

    } catch (error) {
        console.error('Error submitting agent enquiry:', error);
        res.status(500).json({ message: error.message });
    }
};

// File upload method for bulk enquiries
exports.uploadEnquiryFile = async (req, res) => {
    try {
        console.log('=== UPLOAD REQUEST STARTED ===');
        console.log('Upload request received:', {
            file: req.file ? req.file.originalname : 'No file',
            agentId: req.body.agentId,
            mimetype: req.file?.mimetype,
            size: req.file?.size
        });

        if (!req.file) {
            console.log('ERROR: No file uploaded');
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const { agentId } = req.body;
        console.log('Agent ID from request:', agentId);
        
        if (!agentId) {
            console.log('ERROR: No agent ID provided');
            return res.status(400).json({ message: 'Agent ID is required' });
        }

        const file = req.file;
        let enquiries = [];
        let processedCount = 0;

        console.log('Processing file:', file.originalname, 'Type:', file.mimetype);

        // Parse CSV file
        if (file.mimetype === 'text/csv') {
            const csvData = file.buffer.toString('utf-8');
            const lines = csvData.split('\n').filter(line => line.trim());

            console.log('CSV lines found:', lines.length);

            // Skip header if exists
            const startIndex = lines[0].toLowerCase().includes('name') ? 1 : 0;

            for (let i = startIndex; i < lines.length; i++) {
                const values = lines[i].split(',').map(v => v.trim());
                if (values.length >= 4) {
                    // Validate and normalize gender
                    let gender = (values[9] || '').toLowerCase().trim();
                    const validGenders = ['male', 'female', 'transgender'];
                    
                    // If gender is invalid, default to 'male' or skip the row
                    if (!validGenders.includes(gender)) {
                        console.log(`Invalid gender "${gender}" in row ${i}, defaulting to 'male'`);
                        gender = 'male';
                        // Alternatively, you could skip the row:
                        // console.log(`Skipping row ${i} due to invalid gender: ${gender}`);
                        // continue;
                    }

                    const enquiry = {
                        FirstName: values[0] || '',
                        MiddleName: values[1] || '',
                        LastName: values[2] || '',
                        InstituteName: values[3] || '',
                        Qualification: values[4] || '',
                        SemesterCompleted: values[5] || '',
                        Place: values[6] || '',
                        ContactNumber: values[7] || '',
                        EmailId: values[8] || '',
                        Gender: gender,
                        status: 'pending', // No OTP for bulk uploads
                        executiveId: null, // No executive assignment for agent uploads
                        agentId: agentId || null,
                        isVerified: true, // Auto-verified for bulk uploads
                        createdAt: new Date()
                    };
                    enquiries.push(enquiry);
                }
            }
        }
        // Parse Excel files (XLSX, XLS)
        else if (file.mimetype.includes('sheet')) {
            const XLSX = require('xlsx');
            const workbook = XLSX.read(file.buffer, { type: 'buffer' });
            const sheetName = workbook.SheetNames[0]; // Use first sheet
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

            console.log('Excel rows found:', jsonData.length);
            console.log('First few rows:', jsonData.slice(0, 3));

            // Skip header if exists
            const startIndex = jsonData.length > 0 &&
                (jsonData[0][0]?.toString().toLowerCase().includes('name') ||
                    jsonData[0][0]?.toString().toLowerCase().includes('first')) ? 1 : 0;

            console.log('Start index (after header skip):', startIndex);

            for (let i = startIndex; i < jsonData.length; i++) {
                const row = jsonData[i];
                console.log(`Processing row ${i}:`, row);

                // Check if this is comma-separated data in a single column
                let processedRow = row;
                if (row.length === 1 && typeof row[0] === 'string' && row[0].includes(',')) {
                    // Split the comma-separated string into individual values
                    processedRow = row[0].split(',').map(v => v.trim());
                    console.log(`Converted comma-separated row to:`, processedRow);
                }

                if (processedRow.length >= 4) {
                    // Validate and normalize gender for Excel files too
                    let gender = (processedRow[9]?.toString() || '').toLowerCase().trim();
                    const validGenders = ['male', 'female', 'transgender'];
                    
                    // If gender is invalid, default to 'male'
                    if (!validGenders.includes(gender)) {
                        console.log(`Invalid gender "${gender}" in Excel row ${i}, defaulting to 'male'`);
                        gender = 'male';
                    }

                    const enquiry = {
                        FirstName: processedRow[0]?.toString() || '',
                        MiddleName: processedRow[1]?.toString() || '',
                        LastName: processedRow[2]?.toString() || '',
                        InstituteName: processedRow[3]?.toString() || '',
                        Qualification: processedRow[4]?.toString() || '',
                        SemesterCompleted: processedRow[5]?.toString() || '',
                        Place: processedRow[6]?.toString() || '',
                        ContactNumber: processedRow[7]?.toString() || '',
                        EmailId: processedRow[8]?.toString() || '',
                        Gender: gender,
                        status: 'pending', // No OTP for bulk uploads
                        executiveId: null, // No executive assignment for agent uploads
                        agentId: agentId || null,
                        isVerified: true, // Auto-verified for bulk uploads
                        createdAt: new Date()
                    };

                    console.log(`Created enquiry for row ${i}:`, enquiry);
                    enquiries.push(enquiry);
                } else {
                    console.log(`Row ${i} skipped - insufficient columns (${processedRow.length})`);
                }
            }
        } else {
            return res.status(400).json({
                message: 'Unsupported file type. Please use CSV or Excel format.'
            });
        }

        console.log('Processed enquiries:', enquiries.length);

        // Bulk insert enquiries
        if (enquiries.length > 0) {
            await Enquiry.insertMany(enquiries);
            processedCount = enquiries.length;
        }

        res.status(200).json({
            message: 'File uploaded successfully',
            processedCount: processedCount,
            fileName: file.originalname
        });

    } catch (error) {
        console.error('Error uploading file:', error);
        res.status(500).json({
            message: 'Error processing file',
            error: error.message
        });
    }
};

// Dashboard Analytics
exports.getDashboardAnalytics = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        // Build date filter
        const dateFilter = {};
        if (startDate && endDate) {
            dateFilter.createdAt = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        // 1. New Enquiries (count enquiries created in the period)
        const newEnquiries = await Enquiry.countDocuments(dateFilter);

        // 2. Number of Walkins (count enquiries with agentId)
        const walkins = await Enquiry.countDocuments({
            ...dateFilter,
            agentId: { $exists: true, $ne: null }
        });

        // 3. Total number of calls (sum of all call notes in the period)
        const callsResult = await Enquiry.aggregate([
            { $match: dateFilter },
            { $unwind: '$callNotes' },
            {
                $match: {
                    'callNotes.date': {
                        $gte: startDate ? new Date(startDate) : new Date('1970-01-01'),
                        $lte: endDate ? new Date(endDate) : new Date()
                    }
                }
            },
            { $count: 'totalCalls' }
        ]);
        const totalCalls = callsResult.length > 0 ? callsResult[0].totalCalls : 0;

        // 4. Total numbers of calls connected (calls with successful connection)
        const connectedCallsResult = await Enquiry.aggregate([
            { $match: dateFilter },
            { $unwind: '$callNotes' },
            {
                $match: {
                    'callNotes.date': {
                        $gte: startDate ? new Date(startDate) : new Date('1970-01-01'),
                        $lte: endDate ? new Date(endDate) : new Date()
                    },
                    'callNotes.status': { $in: ['connected', 'contacted', 'completed'] }
                }
            },
            { $count: 'connectedCalls' }
        ]);
        const connectedCalls = connectedCallsResult.length > 0 ? connectedCallsResult[0].connectedCalls : 0;

        // 5. Total numbers of calls not connected
        const notConnectedCalls = totalCalls - connectedCalls;

        // 6. Number of Admissions (count enquiries with status 'completed')
        const admissions = await Enquiry.countDocuments({
            ...dateFilter,
            status: 'completed'
        });

        res.status(200).json({
            newEnquiries,
            walkins,
            totalCalls,
            connectedCalls,
            notConnectedCalls,
            admissions,
            period: {
                startDate: startDate || 'all time',
                endDate: endDate || 'present'
            }
        });

    } catch (error) {
        console.error('Error fetching dashboard analytics:', error);
        res.status(500).json({
            message: 'Error fetching dashboard analytics',
            error: error.message
        });
    }
};