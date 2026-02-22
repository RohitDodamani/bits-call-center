const mongoose = require('mongoose');
const path = require('path');
const env = process.env.NODE_ENV || 'dev';
const config = require(path.join(__dirname, 'backend', 'config', `${env}.json`));
const User = require('./backend/models/User');

mongoose.connect(config.MONGODB_URI).then(async () => {
    console.log(`Connected to MongoDB (${env})`);

    // Find users with missing email but having @ in username
    const usersToFix = await User.find({
        $or: [
            { email: { $exists: false } },
            { email: null },
            { email: '' }
        ],
        username: /@/
    });

    console.log(`Found ${usersToFix.length} users to fix.`);

    for (const user of usersToFix) {
        user.email = user.username;
        await user.save();
        console.log(`Fixed user: ${user.username}`);
    }

    mongoose.connection.close();
    console.log('Migration complete.');
}).catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
});
