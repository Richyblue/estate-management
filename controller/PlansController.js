// modules/plans/plans.controller.js
const Plans = require('../models/Plans');

// ✅ CREATE PLAN (SUPER ADMIN ONLY)
exports.createPlan = async (req, res) => {
    try {
        const { name, price, max_users, features } = req.body;

        // Basic validation
        if (!name || !price) {
            return res.status(400).json({ message: 'Name and price are required' });
        }

        const plan = await Plans.create({
            name,
            price,
            max_users,
            features
        });

        res.status(201).json({
            message: 'Plan created successfully',
            plan
        });

    } catch (err) {
        res.status(500).json({ message: 'Failed to create plan' });
    }
};


exports.getPlans = async (req, res) => {
    try {
        const plans = await Plans.findAll({
            order: [['id', 'ASC']]
        });

        res.json(plans);

    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch plans' });
    }
};


exports.getPlan = async (req, res) => {
    try {
        const plan = await Plans.findByPk(req.params.id);

        if (!plan) {
            return res.status(404).json({ message: 'Plan not found' });
        }

        res.json(plan);

    } catch (err) {
        res.status(500).json({ message: 'Error fetching plan' });
    }
};



exports.updatePlan = async (req, res) => {
    try {
        const plan = await Plans.findByPk(req.params.id);

        if (!plan) {
            return res.status(404).json({ message: 'Plan not found' });
        }

        const { name, price, max_users, features } = req.body;

        await plan.update({
            name: name ?? plan.name,
            price: price ?? plan.price,
            max_users: max_users ?? plan.max_users,
            features: features ?? plan.features
        });

        res.json({
            message: 'Plan updated successfully',
            plan
        });

    } catch (err) {
        res.status(500).json({ message: 'Failed to update plan' });
    }
};


exports.deletePlan = async (req, res) => {
    try {
        const plan = await Plans.findByPk(req.params.id);

        if (!plan) {
            return res.status(404).json({ message: 'Plan not found' });
        }

        await plan.destroy();

        res.json({ message: 'Plan deleted successfully' });

    } catch (err) {
        res.status(500).json({ message: 'Failed to delete plan' });
    }
};