const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

// Load environment-specific configuration
const env = process.env.NODE_ENV || 'dev';
const config = require(path.join(__dirname, 'config', `${env}.json`));

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
const authRoutes = require('./modules/auth/auth.routes');
const courseRoutes = require('./modules/courses/course.routes');
const enquiryRoutes = require('./modules/enquiries/enquiry.routes');
const executiveRoutes = require('./modules/executives/executive.routes');
const agentRoutes = require('./modules/agents/agent.routes');
const sessionRoutes = require('./modules/sessions/session.routes');
const dropdownRoutes = require('./modules/dropdowns/dropdown.routes');
const supervisorRoutes = require('./modules/supervisor/supervisor.routes');
const reportsRoutes = require('./modules/reports/reports.routes');

app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/enquiries', enquiryRoutes);
app.use('/api/executives', executiveRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/dropdowns', dropdownRoutes);
app.use('/api/supervisor', supervisorRoutes);
app.use('/api/reports', reportsRoutes);

// Database Connection
const MONGODB_URI = config.MONGODB_URI;
mongoose.connect(MONGODB_URI)
    .then(() => {
        console.log(`Connected to MongoDB (${env})`);
    })
    .catch(err => console.error('Could not connect to MongoDB', err));

const PORT = config.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running in ${env} mode on port ${PORT}`);
});
