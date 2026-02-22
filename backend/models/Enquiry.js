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

    SemesterCompleted: {
        type: Number,
        required: true
    },

    Place: {
        type: String,
        required: true
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
        enum: ['male', 'female', 'other'],
        required: true
    },

    // ===============================
    // System Fields
    // ===============================
    otp: {
        type: String,
        required: true
    },

    isVerified: {
        type: Boolean,
        default: false
    },

    status: {
        type: String,
        enum: ['pending', 'verified', 'mismatch', 'follow-up', 'completed', 'assigned', 'contacted', 'no_answer', 'callback'],
        default: 'pending'
    },

    callNotes: [{
        note: String,
        executiveId: String,
        status: String,
        followupDate: Date,
        date: { type: Date, default: Date.now }
    }],

    executiveId: {
        type: String
    }

},
{
    timestamps: true
});

module.exports = mongoose.model('Enquiry', EnquirySchema);