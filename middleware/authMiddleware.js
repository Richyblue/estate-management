require('dotenv').config();
const jwt = require('jsonwebtoken');

// ⚠️ Import your user model (adjust path)
const User = require('../models/User'); 

const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.header('Authorization');

        // 🚫 No token
        if (!authHeader) {
            return res.status(401).json({ message: 'No token provided' });
        }

        // ✅ Bearer format check
        const parts = authHeader.split(' ');
        if (parts.length !== 2 || parts[0] !== 'Bearer') {
            return res.status(401).json({ message: 'Invalid token format' });
        }

        const token = parts[1];

        // 🔐 Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 🚫 Validate payload
        if (!decoded.id || !decoded.role) {
            return res.status(401).json({ message: 'Invalid token payload' });
        }

        // 🔍 Fetch user from DB (IMPORTANT)
        const user = await User.findByPk(decoded.id);

        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }

        // ❌ EMAIL NOT VERIFIED
        if (!user.email_verified) {
            return res.status(403).json({
                message: 'Please verify your email before accessing this resource'
            });
        }

        // 🔥 Attach safe fields
        req.user = {
            id: user.id,
            role: user.role,
            estate_id: user.estate_id || null,
            email_verified: user.email_verified
        };

        next();

    } catch (err) {
        console.error('Auth error:', err.message);

        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expired' });
        }

        if (err.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Invalid token' });
        }

        res.status(500).json({ message: 'Authentication failed' });
    }
};

module.exports = authMiddleware;