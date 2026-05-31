const Subscription = require('../models/Subscription');

exports.requireSubscription = async (req, res, next) => {
    try {
        // 🔐 Ensure user exists
        if (!req.user) {
            return res.status(401).json({
                message: 'Unauthorized: user not found'
            });
        }

        if (!req.user.estate_id) {
            return res.status(400).json({
                message: 'User not linked to any estate'
            });
        }

        // 🔍 Find subscription
        const sub = await Subscription.findOne({
            where: { estate_id: req.user.estate_id }
        });

        if (!sub) {
            return res.status(403).json({
                message: 'No subscription found for this estate'
            });
        }

        // ✅ Allow trial + active
        if (!['active', 'trial'].includes(sub.status)) {
            return res.status(403).json({
                message: 'Subscription inactive'
            });
        }

        // ⏱ Expiry check
        if (new Date() > new Date(sub.end_date)) {
            sub.status = 'expired';
            await sub.save();

            return res.status(403).json({
                message: 'Subscription expired. Please renew.'
            });
        }

        req.subscription = sub;
        next();

    } catch (err) {
        console.error('Subscription middleware error:', err);

        return res.status(500).json({
            message: 'Subscription check failed',
            error: err.message
        });
    }
};