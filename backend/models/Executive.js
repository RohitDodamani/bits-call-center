const mongoose = require('mongoose');

const ExecutiveSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String },
    password: { type: String, required: true, default: 'bits2024' },
    avatar: { type: String },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Executive', ExecutiveSchema);
