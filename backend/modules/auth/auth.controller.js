const User = require('../../models/User');
const jwt = require('jsonwebtoken');
const path = require('path');
const crypto = require('crypto');

const env = process.env.NODE_ENV || 'dev';
const config = require(path.join(__dirname, '..', '..', 'config', `${env}.json`));
const JWT_SECRET = config.JWT_SECRET || 'bits_secret_key_2024';

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        // Search by email OR username to support legacy accounts where email was stored as username
        const user = await User.findOne({
            $or: [
                { email: email },
                { username: email }
            ]
        });

        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            {
                userId: user._id,
                username: user.username,
                role: user.role,
                executiveId: user.executiveId
            },
            JWT_SECRET,
            { expiresIn: '8h' }
        );

        res.status(200).json({
            message: 'Auth successful',
            token: token,
            user: {
                id: user._id,
                email: user.email,
                username: user.username,
                role: user.role,
                executiveId: user.executiveId
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.createExecutiveUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User with this email already exists' });
        }

        // Generate automatic Executive ID (bits001, bits002, etc)
        const Executive = require('../../models/Executive');
        const lastExec = await Executive.findOne().sort({ id: -1 });
        let nextId = 'bits001';

        if (lastExec && lastExec.id.startsWith('bits')) {
            const lastNum = parseInt(lastExec.id.replace('bits', ''));
            nextId = `bits${String(lastNum + 1).padStart(3, '0')}`;
        }

        // Create executive user (username = email)
        const user = await User.create({
            username: email,
            email,
            password,
            role: 'executive',
            executiveId: nextId
        });

        // Also create Executive record
        await Executive.create({
            id: nextId,
            name: email.split('@')[0], // Default name to email prefix
            email: email,
            avatar: nextId.substring(0, 2).toUpperCase()
        });

        res.status(201).json({
            message: `Executive created successfully with ID: ${nextId}`,
            user: {
                id: user._id,
                email: user.email,
                executiveId: user.executiveId
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: 'User with this email does not exist' });
        }

        // Generate reset token
        const token = crypto.randomBytes(20).toString('hex');
        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
        await user.save();

        // In production, configure nodemailer to send this token via email.
        // For demonstration, we return it in the response.
        res.status(200).json({
            message: 'Password reset token generated successfully',
            resetToken: token,
            info: 'In production, this would be sent via email.'
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
