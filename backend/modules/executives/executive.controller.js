const Executive = require('../../models/Executive');

exports.getExecutives = async (req, res) => {
    try {
        const executives = await Executive.find({ isActive: true });
        res.json(executives);
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
