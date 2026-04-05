const express = require('express');
const router = express.Router();
const Agent = require('../../models/Agent');
const User = require('../../models/User');
const XLSX = require('xlsx');
const authMiddleware = require('../../middleware/auth');

// Get all agents
router.get('/', async (req, res) => {
    try {
        const agents = await Agent.find({ isActive: true });
        res.status(200).json(agents);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Export agents to Excel
router.get('/export', authMiddleware, async (req, res) => {
    try {
        const agents = await Agent.find({ isActive: true }).sort({ createdAt: -1 });

        const rows = await Promise.all(
            agents.map(async (agent) => {
                const user = await User.findOne({ role: 'agent', email: agent.email });
                return {
                    AgentId: user?.agentId || '',
                    Name: agent.name || user?.username || '',
                    Email: agent.email || user?.email || '',
                    Password: user ? user.decryptPassword(req.userData.role) : 'N/A',
                    IsActive: agent.isActive ? 'Yes' : 'No',
                    CreatedAt: agent.createdAt ? new Date(agent.createdAt).toISOString() : ''
                };
            })
        );

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(rows);
        XLSX.utils.book_append_sheet(wb, ws, 'Agents');
        const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

        const dateStr = new Date().toISOString().slice(0, 10);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="agents_${dateStr}.xlsx"`);
        return res.status(200).send(buffer);
    } catch (error) {
        return res.status(500).json({ message: error.message || 'Failed to export agents' });
    }
});

// Create new agent
router.post('/', async (req, res) => {
    try {
        const agent = new Agent(req.body);
        await agent.save();
        res.status(201).json({ 
            message: 'Agent created successfully',
            agent: {
                id: agent._id,
                name: agent.name,
                email: agent.email,
                agentId: agent.agentId,
                isActive: agent.isActive
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update agent
router.put('/:id', async (req, res) => {
    try {
        const agent = await Agent.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        res.status(200).json({ 
            message: 'Agent updated successfully',
            agent: {
                id: agent._id,
                name: agent.name,
                email: agent.email,
                agentId: agent.agentId,
                isActive: agent.isActive
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Delete agent
router.delete('/:id', async (req, res) => {
    try {
        await Agent.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Agent deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
