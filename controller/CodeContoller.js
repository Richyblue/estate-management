const crypto = require('crypto');
const QRCode = require('qrcode');
const Accesscode = require('../models/Accesscode');

exports.createAccessCode = async (req, res) => {
    try {
        const { visitor_name, expires_at } = req.body;

        const occupant_id = req.user.id;
        const estate_id = req.user.estate_id;

        // ✅ Validate input
        if (!visitor_name) {
            return res.status(400).json({
                message: 'Visitor name is required'
            });
        }

        // ⏱ Validate expiry
        let expiryDate;

        if (expires_at) {
            expiryDate = new Date(expires_at);

            if (isNaN(expiryDate)) {
                return res.status(400).json({
                    message: 'Invalid expires_at format'
                });
            }
        } else {
            // 🔥 Default: 2 hours
            expiryDate = new Date(Date.now() + 2 * 60 * 60 * 1000);
        }

        // 🔐 Secure 6-digit code
        const code = crypto.randomInt(100000, 999999).toString();

        // 📦 Create access record
        const access = await Accesscode.create({
            code,
            occupant_id,
            estate_id,
            visitor_name,
            status: 'pending',
            expires_at: expiryDate
        });

        // 🔗 Generate QR
        const qrData = JSON.stringify({
            code: access.code,
            estate_id: access.estate_id
        });

        const qrImage = await QRCode.toDataURL(qrData);

        return res.status(201).json({
            message: "Access code created successfully",
            access,
            qr: qrImage
        });

    } catch (err) {
        console.error('Create access error:', err);

        return res.status(500).json({
            message: 'Failed to create access code',
            error: err.message
        });
    }
};

exports.verifyAccess = async (req, res) => {
    try {
        const { code } = req.body;
        const guard_id = req.user.id;

        const access = await Accesscode.findOne({ where: { code } });

        if (!access) {
            return res.status(404).json({ message: 'Invalid code' });
        }

        if (access.status === 'used') {
            return res.status(400).json({ message: 'Already used' });
        }

        if (new Date() > new Date(access.expires_at)) {
            access.status = 'expired';
            await access.save();

            return res.status(400).json({ message: 'Expired code' });
        }

        // ✅ Mark entry
        access.status = 'active';
        access.entry_time = new Date();
        access.verified_by = guard_id;

        await access.save();

        return res.json({
            message: 'Access granted',
            visitor: access.visitor_name,
            entry_time: access.entry_time
        });

    } catch (err) {
        res.status(500).json({ message: 'Verification failed' });
    }
};

exports.markExit = async (req, res) => {
    try {
        const { code } = req.body;

        const access = await Accesscode.findOne({ where: { code } });

        if (!access || access.status !== 'active') {
            return res.status(400).json({
                message: 'Visitor not currently inside'
            });
        }

        access.status = 'used';
        access.exit_time = new Date();

        await access.save();

        res.json({
            message: 'Visitor checked out',
            exit_time: access.exit_time
        });

    } catch (err) {
        res.status(500).json({ message: 'Exit failed' });
    }
};

exports.getVisitorLogs = async (req, res) => {
    const estate_id = req.user.estate_id;

    const logs = await Accesscode.findAll({
        where: { estate_id },
        order: [['createdAt', 'DESC']]
    });

    res.json(logs);
};