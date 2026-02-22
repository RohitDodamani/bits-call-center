const mongoose = require('mongoose');

const SettingsSchema = new mongoose.Schema({
    key: {
        type: String,
        required: true,
        unique: true,
        default: 'brochure_settings'
    },
    brochurePdf: {
        type: String,
        default: 'https://bits-it.com/brochure.pdf'
    },
    introVideo: {
        type: String,
        default: 'https://youtube.com/bits-intro'
    },
    promoImage: {
        type: String,
        default: 'https://bits-it.com/promo.jpg'
    },
    websiteUrl: {
        type: String,
        default: 'https://bits-it.com'
    }
}, { timestamps: true });

module.exports = mongoose.model('Settings', SettingsSchema);
