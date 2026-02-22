const Enquiry = require('../../models/Enquiry');

// Generate a random 8-character alphanumeric code
const generateOTP = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
};

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
            SemesterCompleted,
            Place,
            ContactNumber,
            EmailId,
            Gender
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
            SemesterCompleted,
            Place,
            ContactNumber,
            EmailId,
            Gender,
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
        const enquiries = await Enquiry.find().sort({ createdAt: -1 });
        
        // Transform enquiries to include both simplified and detailed field names
        const transformedEnquiries = enquiries.map(enquiry => ({
            // Simplified fields for admin dashboard
            studentName: enquiry.FirstName + ' ' + enquiry.LastName,
            email: enquiry.EmailId,
            phone: enquiry.ContactNumber,
            course: enquiry.InstituteName,
            
            // Detailed fields for executive dashboard
            FirstName: enquiry.FirstName,
            MiddleName: enquiry.MiddleName,
            LastName: enquiry.LastName,
            InstituteName: enquiry.InstituteName,
            Qualification: enquiry.Qualification,
            SemesterCompleted: enquiry.SemesterCompleted,
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
        }));
        
        res.json(transformedEnquiries);
    } catch (error) {
        res.status(500).json({ message: error.message });
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

exports.logCallNote = async (req, res) => {
    try {
        const { id } = req.params;
        const { note, executiveId, status, followupDate } = req.body;

        const enquiry = await Enquiry.findById(id);
        if (!enquiry) return res.status(404).json({ message: 'Enquiry not found' });

        // Log the interaction
        enquiry.callNotes.push({ note, executiveId, status, followupDate });
        enquiry.status = status;
        
        await enquiry.save();
        
        console.log(`Interaction logged for enquiry ${id} by executive ${executiveId}`);
        
        // After successful interaction, assign next verified enquiry to this executive
        const nextUnassignedEnquiry = await Enquiry.findOne({
            executiveId: { $in: [null, "", undefined] },
            status: 'verified'
        });
        
        if (nextUnassignedEnquiry) {
            console.log(`Found next unassigned verified enquiry: ${nextUnassignedEnquiry._id}, assigning to executive ${executiveId}`);
            
            // Assign the next enquiry to this executive
            nextUnassignedEnquiry.executiveId = executiveId;
            nextUnassignedEnquiry.status = 'assigned';
            await nextUnassignedEnquiry.save();
            
            console.log(`Successfully assigned next enquiry ${nextUnassignedEnquiry._id} to executive ${executiveId}`);
        } else {
            console.log(`No more unassigned verified enquiries available for executive ${executiveId}`);
        }

        res.json(enquiry);
    } catch (error) {
        console.error('Error in logCallNote:', error);
        res.status(500).json({ message: error.message });
    }
};

// New method to fetch enquiries by executive ID with pagination
exports.getEnquiriesByExecutive = async (req, res) => {
    try {
        const { executiveId } = req.params;
        const { page = 1, limit = 10 } = req.query;
        
        console.log(`Fetching enquiries for executive: ${executiveId}, page: ${page}, limit: ${limit}`);
        
        // Step 1: Check if executive already has assigned enquiries
        const existingAssignedEnquiries = await Enquiry.find({ executiveId: executiveId });
        console.log(`Executive ${executiveId} has ${existingAssignedEnquiries.length} existing assigned enquiries`);
        
        // Step 2: If no assigned enquiries, assign one verified enquiry
        if (existingAssignedEnquiries.length === 0) {
            console.log('No assigned enquiries found, looking for unassigned verified enquiry...');
            
            const unassignedEnquiry = await Enquiry.findOne({
                executiveId: { $in: [null, "", undefined] },
                status: 'verified'
            });
            
            if (unassignedEnquiry) {
                console.log(`Found unassigned verified enquiry: ${unassignedEnquiry._id}, assigning to executive ${executiveId}`);
                
                // Assign it to this executive
                unassignedEnquiry.executiveId = executiveId;
                unassignedEnquiry.status = 'assigned';
                await unassignedEnquiry.save();
                
                console.log(`Successfully assigned enquiry ${unassignedEnquiry._id} to executive ${executiveId}`);
            } else {
                console.log('No unassigned verified enquiries available');
            }
        }
        
        // Step 3: Return only enquiries assigned to this executive
        const query = { executiveId: executiveId };
        console.log('Final query for executive enquiries:', query);
        
        // Calculate skip for pagination
        const skipCount = (page - 1) * limit;
        
        // Get total count for pagination
        const totalCount = await Enquiry.countDocuments(query);
        
        // Find enquiries with pagination
        const enquiries = await Enquiry.find(query)
            .skip(skipCount)
            .limit(limit)
            .sort({ createdAt: -1 }); // Most recent first
        
        console.log(`Found ${enquiries.length} enquiries for executive ${executiveId} (page ${page})`);
        
        // Return paginated response
        res.json({
            enquiries,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalCount / limit),
                hasNext: enquiries.length === limit,
                hasPrev: page > 1,
                totalCount: totalCount
            }
        });
        
    } catch (error) {
        console.error('Error fetching enquiries by executive:', error);
        res.status(500).json({ 
            error: error.message,
            message: `Failed to fetch enquiries for executive ${executiveId}`
        });
    }
};
