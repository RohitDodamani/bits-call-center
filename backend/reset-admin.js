const mongoose = require('mongoose');
const path = require('path');

// Load environment-specific configuration
const env = process.env.NODE_ENV || 'dev';
const config = require(path.join(__dirname, 'config', `${env}.json`));

const User = require('./models/User');

async function resetAdmin() {
    try {
        // Connect to MongoDB
        await mongoose.connect(config.MONGODB_URI);
        console.log(`Connected to MongoDB (${env})`);

        // Delete old admin if exists
        const deleted = await User.deleteOne({ username: 'Admin001' });
        if (deleted.deletedCount > 0) {
            console.log('✓ Deleted old admin user (Admin001)');
        }

        // Create new Admin
        const newAdmin = await User.create({
            username: 'Admin',
            email: 'admin@bits.com',
            password: 'adminbits',
            role: 'admin'
        });

        console.log('✓ New admin user created successfully!');
        console.log('  Username: Admin');
        console.log('  Password: adminbits');

        await mongoose.connection.close();
        console.log('Database connection closed.');
        process.exit(0);
    } catch (error) {
        console.error('Error resetting admin:', error);
        process.exit(1);
    }
}

resetAdmin();
