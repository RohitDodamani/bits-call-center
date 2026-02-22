const mongoose = require('mongoose');
const path = require('path');

// Load environment-specific configuration
const env = process.env.NODE_ENV || 'dev';
const config = require(path.join(__dirname, 'config', `${env}.json`));

const User = require('./models/User');

async function seedAdmin() {
    try {
        // Connect to MongoDB
        await mongoose.connect(config.MONGODB_URI);
        console.log(`Connected to MongoDB (${env})`);

        // Check if admin already exists
        const adminExists = await User.findOne({ username: 'Admin' });

        if (adminExists) {
            console.log('Admin user already exists!');
        } else {
            // Create Admin
            await User.create({
                username: 'Admin',
                email: 'admin@bits.com',
                password: 'adminbits',
                role: 'admin'
            });
            console.log('✓ Admin user created successfully!');
            console.log('  Username: Admin');
            console.log('  Password: adminbits');
        }

        await mongoose.connection.close();
        console.log('Database connection closed.');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding admin:', error);
        process.exit(1);
    }
}

seedAdmin();
