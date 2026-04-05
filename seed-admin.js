const mongoose = require('mongoose');
const path = require('path');

// Load config
const env = process.argv[2] || process.env.NODE_ENV || 'dev';
const config = require(path.join(__dirname, 'backend', 'config', `${env}.json`));

// Import User model
const User = require('./backend/models/User');

async function seedAdmin() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(config.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Check if admin already exists
        const existingAdmin = await User.findOne({ role: 'admin' });
        if (existingAdmin) {
            console.log('Admin user already exists:', existingAdmin.email);
            console.log('Password (encrypted):', existingAdmin.password);
            process.exit(0);
        }

        console.log('Creating admin user...');

        // Create admin user - password will be auto-encrypted by User model
        const adminUser = await User.create({
            username: 'admin@bits.com',
            email: 'admin@bits.com',
            password: 'Admin@123!@', // 10 chars, 2 special: @ and !
            role: 'admin'
        });

        console.log('✅ Admin user created successfully!');
        console.log('Admin ID:', adminUser._id);
        console.log('Admin Email:', adminUser.email);
        console.log('Admin Username:', adminUser.username);
        console.log('Admin Role:', adminUser.role);
        console.log('Password (encrypted):', adminUser.password);
        console.log('\n🔐 Login Credentials:');
        console.log('Email: admin@bits.com');
        console.log('Password: Admin@123!@');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding admin:', error);
        process.exit(1);
    }
}

seedAdmin();
