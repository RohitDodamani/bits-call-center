const User = require('../../models/User');
const jwt = require('jsonwebtoken');
const path = require('path');
const crypto = require('crypto');
const XLSX = require('xlsx');

const env = process.env.NODE_ENV || 'dev';
const config = require(path.join(__dirname, '..', '..', 'config', `${env}.json`));
const JWT_SECRET = config.JWT_SECRET || 'bits_secret_key_2024';

// Admin portal login - only for admin roles
exports.adminLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        const user = await User.findOne({
            $or: [
                { email: email },
                { username: email }
            ]
        });

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        if (!(await user.comparePassword(password))) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Only allow admin roles for admin portal
        const allowedRoles = ['admin', 'executive', 'agent', 'supervisor'];
        if (!allowedRoles.includes(user.role)) {
            return res.status(403).json({ 
                message: 'Access denied. You are not authorized to access admin portal.' 
            });
        }

        const token = jwt.sign(
            {
                userId: user._id,
                username: user.username,
                role: user.role,
                executiveId: user.executiveId,
                agentId: user.agentId,
                supervisorId: user.supervisorId,
                isAdmin: true,
                role: user.role
            },
            JWT_SECRET,
            { expiresIn: '8h' }
        );

        res.status(200).json({
            message: 'Admin login successful',
            token: token,
            user: {
                id: user._id,
                email: user.email,
                username: user.username,
                role: user.role,
                executiveId: user.executiveId,
                agentId: user.agentId,
                supervisorId: user.supervisorId
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Telecaller portal login - only for telecaller roles
exports.telecallerLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        const user = await User.findOne({
            $or: [
                { email: email },
                { username: email }
            ]
        });

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        if (!(await user.comparePassword(password))) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Only allow telecaller roles for telecaller portal
        if (user.role !== 'telecaller') {
            return res.status(403).json({ 
                message: 'Access denied. You are not authorized to access telecaller portal.' 
            });
        }

        const token = jwt.sign(
            {
                userId: user._id,
                username: user.username,
                role: user.role,
                isTelecaller: true
            },
            JWT_SECRET,
            { expiresIn: '8h' }
        );

        res.status(200).json({
            message: 'Telecaller login successful',
            token: token,
            user: {
                id: user._id,
                email: user.email,
                username: user.username,
                role: user.role
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

exports.createAgentUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User with this email already exists' });
        }

        // Generate automatic Agent ID (agt001, agt002, etc)
        const Agent = require('../../models/Agent');
        const lastAgent = await Agent.findOne().sort({ id: -1 });
        let nextId = 'agt001';

        if (lastAgent && lastAgent.id.startsWith('agt')) {
            const lastNum = parseInt(lastAgent.id.replace('agt', ''));
            nextId = `agt${String(lastNum + 1).padStart(3, '0')}`;
        }

        // Create agent user (username = email)
        const user = await User.create({
            username: email,
            email,
            password,
            role: 'agent',
            agentId: nextId
        });

        // Also create Agent record
        await Agent.create({
            id: nextId,
            name: email.split('@')[0], // Default name to email prefix
            email: email,
            avatar: nextId.substring(0, 2).toUpperCase()
        });

        res.status(201).json({
            message: `Agent created successfully with ID: ${nextId}`,
            user: {
                id: user._id,
                email: user.email,
                username: user.username,
                role: user.role,
                agentId: user.agentId
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.createSupervisorUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User with this email already exists' });
        }

        // Generate automatic Supervisor ID (spv001, spv002, etc)
        let nextId = 'spv001';
        
        // For now, simple increment - in production you might want a separate Supervisor model
        const lastSupervisor = await User.findOne({ role: 'supervisor' }).sort({ supervisorId: -1 });
        if (lastSupervisor && lastSupervisor.supervisorId && lastSupervisor.supervisorId.startsWith('spv')) {
            const lastNum = parseInt(lastSupervisor.supervisorId.replace('spv', ''));
            nextId = `spv${String(lastNum + 1).padStart(3, '0')}`;
        }

        // Create supervisor user (username = email)
        const user = await User.create({
            username: email,
            email,
            password,
            role: 'supervisor',
            supervisorId: nextId
        });

        res.status(201).json({
            message: `Supervisor created successfully with ID: ${nextId}`,
            user: {
                id: user._id,
                email: user.email,
                username: user.username,
                role: user.role,
                supervisorId: user.supervisorId
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getAgents = async (req, res) => {
    try {
        const agents = await User.find({ role: 'agent' });
        
        // Get agent data from Agent model for each user
        const Agent = require('../../models/Agent');
        const agentsWithPasswords = await Promise.all(
            agents.map(async (user) => {
                const agent = await Agent.findOne({ id: user.agentId });
                console.log(`Agent ${user.agentId}: Agent found =`, !!agent);
                return {
                    id: user._id,
                    name: agent ? agent.name : 'N/A',
                    username: user.username,
                    email: user.email,
                    password: user.decryptPassword(req.userData.role), // Use role from JWT
                    agentId: user.agentId,
                    role: user.role
                };
            })
        );
        
        console.log('Final agents with passwords:', agentsWithPasswords);
        res.json(agentsWithPasswords);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getSupervisors = async (req, res) => {
    try {
        const supervisors = await User.find({ role: 'supervisor' });
        
        const supervisorsWithPasswords = supervisors.map(user => ({
            id: user._id,
            name: user.username, // Use username as name since no separate Supervisor model
            username: user.username,
            email: user.email,
            password: user.decryptPassword(req.userData.role), // Use role from JWT
            supervisorId: user.supervisorId,
            role: user.role
        }));
        
        res.json(supervisorsWithPasswords);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.exportSupervisors = async (req, res) => {
    try {
        const supervisors = await User.find({ role: 'supervisor' }).sort({ createdAt: -1 });
        const rows = supervisors.map((user) => ({
            SupervisorId: user.supervisorId || '',
            Name: user.username || '',
            Email: user.email || '',
            Password: user.decryptPassword(req.userData.role),
            Role: user.role || '',
            CreatedAt: user.createdAt ? new Date(user.createdAt).toISOString() : ''
        }));

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(rows);
        XLSX.utils.book_append_sheet(wb, ws, 'Supervisors');
        const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

        const dateStr = new Date().toISOString().slice(0, 10);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="supervisors_${dateStr}.xlsx"`);
        return res.status(200).send(buffer);
    } catch (error) {
        return res.status(500).json({ message: error.message || 'Failed to export supervisors' });
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
