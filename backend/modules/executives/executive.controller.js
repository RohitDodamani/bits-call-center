const Executive = require('../../models/Executive');
const XLSX = require('xlsx');

exports.getExecutives = async (req, res) => {
    try {
        const executives = await Executive.find({ isActive: true });
        
        // Get password data from User model for each executive
        const User = require('../../models/User');
        const executivesWithPasswords = await Promise.all(
            executives.map(async (exec) => {
                const user = await User.findOne({ executiveId: exec.id });
                console.log(`Executive ${exec.id}: User found =`, !!user);
                return {
                    ...exec.toObject(),
                    password: user ? user.decryptPassword(req.userData.role) : 'N/A'
                };
            })
        );
        
        console.log('Final executives with passwords:', executivesWithPasswords);
        res.json(executivesWithPasswords);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.createExecutive = async (req, res) => {
    try {
        const executive = new Executive(req.body);
        const newExecutive = await executive.save();
        res.status(201).json(newExecutive);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.updateExecutive = async (req, res) => {
    console.log('PUT /api/executives/' + req.params.id, req.body);
    try {
        const { name, email, avatar, isActive, password } = req.body;
        const executive = await Executive.findOneAndUpdate(
            { id: req.params.id },
            { name, email, avatar, isActive },
            { new: true }
        );

        if (!executive) return res.status(404).json({ message: 'Executive not found' });

        // If name or email changed, update the User record as well
        if (name || email) {
            const User = require('../../models/User');
            const updateData = {};
            if (name) updateData.username = name;
            if (email) updateData.email = email;
            if (password) updateData.password = password; // Option to update password

            await User.findOneAndUpdate(
                { executiveId: req.params.id },
                updateData
            );
        }

        res.json(executive);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.exportExecutives = async (req, res) => {
    try {
        const executives = await Executive.find({ isActive: true }).sort({ createdAt: -1 });
        const User = require('../../models/User');

        const rows = await Promise.all(
            executives.map(async (exec) => {
                const user = await User.findOne({ executiveId: exec.id });
                return {
                    ExecutiveId: exec.id || '',
                    Name: exec.name || user?.username || '',
                    Email: exec.email || user?.email || '',
                    Password: user ? user.decryptPassword(req.userData.role) : 'N/A',
                    IsActive: exec.isActive ? 'Yes' : 'No',
                    CreatedAt: exec.createdAt ? new Date(exec.createdAt).toISOString() : ''
                };
            })
        );

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(rows);
        XLSX.utils.book_append_sheet(wb, ws, 'Executives');
        const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

        const dateStr = new Date().toISOString().slice(0, 10);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="executives_${dateStr}.xlsx"`);
        return res.status(200).send(buffer);
    } catch (error) {
        return res.status(500).json({ message: error.message || 'Failed to export executives' });
    }
};
