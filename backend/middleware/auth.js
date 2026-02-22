const jwt = require('jsonwebtoken');
const path = require('path');

// Load config to get JWT_SECRET
const env = process.env.NODE_ENV || 'dev';
const config = require(path.join(__dirname, '..', 'config', `${env}.json`));
const JWT_SECRET = config.JWT_SECRET || 'bits_secret_key_2024';

module.exports = (req, res, next) => {
    try {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        req.userData = decoded;
        next();
    } catch (error) {
        return res.status(401).json({
            message: 'Authentication failed'
        });
    }
};
