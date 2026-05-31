require('dotenv').config();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const User = require('../models/User');

exports.login = async (req, res) => {
    try {
        let { email, password } = req.body;

        // Normalize input
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        email = email.toLowerCase().trim();

        // Find user
        const user = await User.findOne({ where: { email } });

        // Generic error (avoid giving attackers clues)
        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Compare password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Email not verified
        if (!user.email_verified) {
            return res.status(403).json({
                message: 'Email not verified',
                action: 'VERIFY_EMAIL'
            });
        }

        // Generate JWT (keep payload minimal)
        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        // Role-based redirect
        const roleRedirectMap = {
            g: '/main-admin/dashboard',
            e: '/estate/dashboard',
            t: '/tenant/dashboard',
            s: '/security/dashboard'
        };

        const redirectTo = roleRedirectMap[user.role];

        if (!redirectTo) {
            return res.status(403).json({ message: 'Unauthorized role' });
        }

        // Clean response (no sensitive data)
        return res.status(200).json({
            message: 'Login successful',
            token,
            role: user.role,
            redirectTo
        });

    } catch (err) {
        console.error('Login error:', err);

        return res.status(500).json({
            message: 'Login failed. Please try again later.'
        });
    }
};
// Mail transporter (move to config file later if scaling)
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: 587,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

exports.register = async (req, res) => {
    try {
        const { fullname, email, password, estate_id, role } = req.body;

        // Validate required fields
        if (!fullname || !email || !password || !role) {
            return res.status(400).json({ message: 'All fields are required.' });
        }

        // Validate role
        if (!['g', 'e', 't', 's'].includes(role)) {
            return res.status(400).json({ message: 'Invalid role specified.' });
        }

        // Check if user exists
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already registered.' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 🔑 Generate email verification token
        const rawToken = crypto.randomBytes(32).toString('hex');
        const verificationToken = crypto
            .createHash('sha256')
            .update(rawToken)
            .digest('hex');

        // Create user
        const newUser = await User.create({
            fullname,
            email,
            password: hashedPassword,
            estate_id,
            role,
            email_verified: false,
            email_verification_token: verificationToken
        });

        // 🔗 Create verification link
        const verifyLink = `${process.env.APP_URL}/api/auth/verify-email/${rawToken}`;

        // Send email
        await transporter.sendMail({
            to: email,
            subject: 'Verify Your Email',
            html: `
                <h3>Welcome to Our Platform</h3>
                <p>Hello ${fullname},</p>
                <p>Please verify your email by clicking the link below:</p>
                <a href="${verifyLink}" target="_blank">Verify Email</a>
                <p>If you did not register, please ignore this email.</p>
            `
        });

        // Generate JWT (optional before verification — your choice)
        const token = jwt.sign(
            { id: newUser.id, role: newUser.role },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        // Response
        res.status(201).json({
            message: 'User registered successfully. Please verify your email.',
            user: {
                id: newUser.id,
                fullname: newUser.fullname,
                email: newUser.email,
                estate_id: newUser.estate_id,
                role: newUser.role,
                email_verified: newUser.email_verified
            },
            token // you can remove this if you want strict verification first
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            message: 'Registration failed.',
            error: error.message
        });
    }
};
