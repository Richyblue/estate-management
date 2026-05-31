const crypto = require('crypto');
const { User } = require('../models/User'); // adjust path if needed

exports.verifyEmail = async (req, res) => {
    try {
        const { token } = req.params;

        // No token
        if (!token) {
            return res.status(400).json({ message: 'Verification token is required' });
        }

        // Hash the incoming token (MUST match stored hash)
        const hashedToken = crypto
            .createHash('sha256')
            .update(token)
            .digest('hex');

        // Find user with this token
        const user = await User.findOne({
            where: { email_verification_token: hashedToken }
        });

        // Invalid or expired token
        if (!user) {
            return res.status(400).json({
                message: 'Invalid or expired verification link'
            });
        }

        // ⚠️ Already verified
        if (user.email_verified) {
            return res.status(400).json({
                message: 'Email already verified'
            });
        }

        // Mark as verified
        user.email_verified = true;
        user.email_verification_token = null;

        await user.save();

        return res.status(200).json({
            message: 'Email verified successfully. You can now log in.'
        });

    } catch (error) {
        console.error('Email verification error:', error);

        return res.status(500).json({
            message: 'Email verification failed',
            error: error.message
        });
    }
};