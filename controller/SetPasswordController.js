const crypto = require('crypto');
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const { User } = require('../models/User');

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        const normalizedEmail = email.toLowerCase().trim();

        const user = await User.findOne({ where: { email: normalizedEmail } });

        // 🔐 Always return success (avoid user enumeration)
        if (!user) {
            return res.status(200).json({
                message: 'If that email exists, a reset link has been sent'
            });
        }

        // 🔑 Generate token
        const rawToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto
            .createHash('sha256')
            .update(rawToken)
            .digest('hex');

        // ⏱ Expiry (1 hour)
        user.reset_password_token = hashedToken;
        user.reset_password_expires = Date.now() + 3600000;

        await user.save();

        // 🔗 Reset link
        const resetLink = `${process.env.FRONTEND_URL}/reset-password/${rawToken}`;

        // 📧 Send email
        await transporter.sendMail({
            to: user.email,
            subject: 'Password Reset Request',
            html: `
                <h3>Password Reset</h3>
                <p>You requested to reset your password.</p>
                <a href="${resetLink}">Reset Password</a>
                <p>This link expires in 1 hour.</p>
            `
        });

        return res.status(200).json({
            message: 'If that email exists, a reset link has been sent'
        });

    } catch (error) {
        console.error('Forgot password error:', error);
        return res.status(500).json({ message: 'Request failed' });
    }
};


exports.resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;

        if (!password) {
            return res.status(400).json({ message: 'New password is required' });
        }

        // 🔐 Hash incoming token
        const hashedToken = crypto
            .createHash('sha256')
            .update(token)
            .digest('hex');

        // 🔍 Find valid user
        const user = await User.findOne({
            where: {
                reset_password_token: hashedToken,
                reset_password_expires: { [Op.gt]: new Date() }
            }
        });

        if (!user) {
            return res.status(400).json({
                message: 'Invalid or expired reset link'
            });
        }

        // 🔐 Hash new password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        // 🧹 Clear reset fields
        user.reset_password_token = null;
        user.reset_password_expires = null;

        await user.save();

        return res.status(200).json({
            message: 'Password reset successful. You can now log in.'
        });

    } catch (error) {
        console.error('Reset password error:', error);
        return res.status(500).json({ message: 'Reset failed' });
    }
};