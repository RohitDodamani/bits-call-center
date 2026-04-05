const mongoose = require('mongoose');

const EnquirySchema = new mongoose.Schema(
    {
        // ===============================
        // Student Personal Details
        // ===============================
        FirstName: {
            type: String,
            required: true,
            trim: true
        },

        MiddleName: {
            type: String,
            trim: true
        },

        LastName: {
            type: String,
            required: true,
            trim: true
        },

        InstituteName: {
            type: String,
            required: true
        },

        Qualification: {
            type: String,
            required: true
        },
        SubQualification: {
            type: String
        },

        SemesterCompleted: {
            type: String,
            required: true
        },

        Place: {
            type: String,
            required: true
        },
        District: {
            type: String
        },
        State: {
            type: String
        },

        ContactNumber: {
            type: String,
            required: true
        },

        EmailId: {
            type: String,
            required: true,
            lowercase: true
        },

        Gender: {
            type: String,
            enum: ['male', 'female', 'transgender'],
            required: true
        },
        course: {
            type: String
        },

        // ===============================
        // System Fields
        // ===============================
        otp: {
            type: String,
            required: false
        },

        isVerified: {
            type: Boolean,
            default: false
        },

        status: {
            type: String,
            enum: ['pending', 'verified', 'mismatch', 'follow-up', 'completed', 'assigned', 'contacted', 'no_answer', 'callback', 'escalated'],
            default: 'pending'
        },

        callNotes: [{
            note: String,
            executiveId: String,
            supervisorId: String,
            status: String,
            leadStatus: String,
            followupDate: Date,
            preferredTime: {
                type: String   // You can later convert to Date if needed
            },
            date: { type: Date, default: Date.now }
        }],

        executiveId: {
            type: String
        },
        supervisorId: {
            type: String
        },
        agentId: {
            type: String
        },

        // ===============================
        // Escalation Fields
        // ===============================
        escalatedAt: {
            type: Date
        },
        escalatedFrom: {
            type: String
        }

    },
    {
        timestamps: true
    });

module.exports = mongoose.model('Enquiry', EnquirySchema);