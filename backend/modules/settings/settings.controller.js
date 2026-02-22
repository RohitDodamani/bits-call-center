const Settings = require('../../models/Settings');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

console.log('Settings Controller: Initializing...');

// Configure Multer Storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../../uploads');
        if (!fs.existsSync(uploadPath)) {
            console.log('Creating uploads directory:', uploadPath);
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

exports.uploadMiddleware = upload.fields([
    { name: 'brochurePdf', maxCount: 1 },
    { name: 'promoImage', maxCount: 1 }
]);

exports.getSettings = async (req, res) => {
    console.log('GET /api/settings request received');
    try {
        let settings = await Settings.findOne({ key: 'brochure_settings' });
        if (!settings) {
            console.log('Creating initial settings record');
            settings = await Settings.create({ key: 'brochure_settings' });
        }
        res.json(settings);
    } catch (error) {
        console.error('getSettings Error:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.updateSettings = async (req, res) => {
    console.log('PUT /api/settings request received');
    try {
        const updateData = { ...req.body };

        // Handle uploaded files
        if (req.files) {
            if (req.files.brochurePdf) {
                console.log('Saving uploaded brochure:', req.files.brochurePdf[0].filename);
                updateData.brochurePdf = `/uploads/${req.files.brochurePdf[0].filename}`;
            }
            if (req.files.promoImage) {
                console.log('Saving uploaded promo image:', req.files.promoImage[0].filename);
                updateData.promoImage = `/uploads/${req.files.promoImage[0].filename}`;
            }
        }

        const settings = await Settings.findOneAndUpdate(
            { key: 'brochure_settings' },
            updateData,
            { new: true, upsert: true }
        );
        res.json(settings);
    } catch (error) {
        console.error('updateSettings Error:', error);
        res.status(400).json({ message: error.message });
    }
};
