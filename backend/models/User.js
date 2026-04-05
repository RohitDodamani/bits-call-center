const mongoose = require('mongoose');
const crypto = require('crypto');
const path = require('path');

// Load config to get ENCRYPTION_KEY
const env = process.env.NODE_ENV || 'dev';
const config = require(path.join(__dirname, '..', 'config', `${env}.json`));

// AES encryption configuration
const ENCRYPTION_KEY = config.ENCRYPTION_KEY || 'bits_encryption_key_32_chars!!!!';
const IV_LENGTH = 16;

// Encrypt function
function encrypt(text) {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
}

// Decrypt function
function decrypt(encryptedText) {
    try {
        const parts = encryptedText.split(':');
        const iv = Buffer.from(parts[0], 'hex');
        const encrypted = parts[1];
        const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch (error) {
        return encryptedText; // Return as-is if decryption fails
    }
}

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { 
        type: String, 
        required: true,
        validate: {
            validator: function(password) {
                // At least 8 chars, with at least 2 special characters
                return password.length >= 8 && 
                       (password.match(/[^A-Za-z0-9]/g) || []).length >= 2;
            },
            message: 'Password must be at least 8 characters with 2 special characters'
        }
    },
    role: { type: String, enum: ['admin', 'executive', 'agent', 'supervisor'], required: true },
    executiveId: { type: String }, // Links to Executive model if role is executive
    agentId: { type: String }, // Links to Agent model if role is agent
    supervisorId: { type: String }, // Links to Supervisor model if role is supervisor
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    createdAt: { type: Date, default: Date.now }
});

// Hash password before saving using AES encryption
UserSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    this.password = encrypt(this.password); // AES encrypt instead of bcrypt hash
});

// Compare password method - AES decrypt and compare
UserSchema.methods.comparePassword = async function (candidatePassword) {
    const decryptedPassword = decrypt(this.password);
    return candidatePassword === decryptedPassword;
};

// Decrypt password method for admin display only
UserSchema.methods.decryptPassword = function(requestingUserRole) {
    // Only show decrypted password for admin users
    if (requestingUserRole !== 'admin') {
        return '********'; // Masked for non-admin users
    }
    
    // Decrypt and return original password for admin
    return decrypt(this.password);
};

module.exports = mongoose.model('User', UserSchema);
