const Plan = require('../models/Plans');
const User = require('../models/User');

exports.checkPlanLimit = (field) => {
    return async (req, res, next) => {
        const sub = req.subscription;

        const plan = await Plan.findByPk(sub.plan_id);

        if (!plan) {
            return res.status(403).json({ message: 'Plan not found' });
        }

        // Example: limit users
        if (field === 'users') {
            const count = await User.count({
                where: { estate_id: req.user.estate_id }
            });

            if (count >= plan.max_users) {
                return res.status(403).json({
                    message: 'User limit reached for your plan'
                });
            }
        }

        next();
    };
};