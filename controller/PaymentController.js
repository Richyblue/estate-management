const axios = require('axios');
const Plan = require('../models/Plans');
const Subscription = require('../models/Subscription');

exports.initializePayment = async (req, res) => {
    try {
        const user = req.user;
        const { plan_id } = req.body;

        if (!user.estate_id) {
            return res.status(400).json({
                message: 'User is not linked to any estate'
            });
        }

        // 🔍 Validate plan
        const plan = await Plan.findByPk(plan_id);
        if (!plan) {
            return res.status(404).json({ message: 'Plan not found' });
        }

        // 🔍 Check estate subscription
        const subscription = await Subscription.findOne({
            where: { estate_id: user.estate_id }
        });

        if (subscription && subscription.status === 'active') {
            return res.status(400).json({
                message: 'Estate already has an active subscription'
            });
        }

        // 🔑 reference now uses estate_id
        const tx_ref = `estate_${user.estate_id}_${plan.id}_${Date.now()}`;

        const response = await axios.post(
            `${process.env.FLW_BASE_URL}/payments`,
            {
                tx_ref,
                amount: plan.price,
                currency: "NGN",

                meta: {
                    estate_id: user.estate_id,
                    plan_id: plan.id,
                    type: "estate_subscription"
                },

                redirect_url: `${process.env.FRONTEND_URL}/api/payment/verify`,

                customer: {
                    email: user.email,
                    name: user.fullname
                },

                customizations: {
                    title: "Estate Subscription",
                    description: `Subscription for ${plan.name}`
                }
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`
                }
            }
        );

        return res.json({
            payment_link: response.data.data.link
        });

    } catch (error) {
        console.error('Init error:', error.response?.data || error.message);

        res.status(500).json({
            message: 'Payment initialization failed'
        });
    }
};

const axios = require('axios');
const { Subscription, Plan } = require('../models');

exports.verifyPayment = async (req, res) => {
    try {
        const { transaction_id, tx_ref } = req.query;

        if (!transaction_id || !tx_ref) {
            return res.redirect(`${process.env.FRONTEND_URL}/payment-error`);
        }

        // 🔐 Verify with Flutterwave
        const response = await axios.get(
            `${process.env.FLW_BASE_URL}/transactions/${transaction_id}/verify`,
            {
                headers: {
                    Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`
                }
            }
        );

        const data = response.data.data;

        // ✅ Validate payment integrity
        if (
            data.status === "successful" &&
            data.tx_ref === tx_ref &&
            data.currency === "NGN"
        ) {

            // 🔒 Prevent duplicate processing
            const existing = await Subscription.findOne({
                where: { reference: tx_ref }
            });

            if (existing) {
                return res.redirect(`${process.env.FRONTEND_URL}/payment-success`);
            }

            /**
             * 🔥 IMPORTANT CHANGE
             * tx_ref format:
             * estate_{estateId}_{planId}_{timestamp}
             */
            const [, estateId, planId] = tx_ref.split('_');

            // 🔍 Validate plan
            const plan = await Plan.findByPk(planId);
            if (!plan) {
                return res.redirect(`${process.env.FRONTEND_URL}/payment-error`);
            }

            // ⏱ Subscription duration
            const startDate = new Date();
            const endDate = new Date(
                Date.now() + plan.duration_days * 24 * 60 * 60 * 1000
            );

            // 🔐 Capture authorization for auto-renew
            const authorizationCode =
                data.card?.authorization?.authorization_code || null;

            // 🔄 Expire previous estate subscription
            await Subscription.update(
                { status: 'expired' },
                {
                    where: {
                        estate_id: estateId,
                        status: ['active', 'trial']
                    }
                }
            );

            // ✅ Create new subscription (ESTATE BASED)
            await Subscription.create({
                estate_id: estateId,
                plan_id: plan.id,
                amount: data.amount,
                reference: tx_ref,
                authorization_code: authorizationCode,
                start_date: startDate,
                end_date: endDate,
                status: 'active'
            });

            return res.redirect(`${process.env.FRONTEND_URL}/payment-success`);
        }

        return res.redirect(`${process.env.FRONTEND_URL}/payment-failed`);

    } catch (error) {
        console.error('Verify error:', error.response?.data || error.message);

        return res.redirect(`${process.env.FRONTEND_URL}/payment-error`);
    }
};
exports.flutterwaveWebhook = async (req, res) => {
    try {
        const secretHash = process.env.FLW_SECRET_HASH;

        // 🔐 Verify webhook source
        if (req.headers['verif-hash'] !== secretHash) {
            return res.status(401).end();
        }

        const payload = req.body;

        if (payload.event === "charge.completed") {
            const data = payload.data;

            // ✅ Only process successful payments
            if (data.status === "successful") {

                const tx_ref = data.tx_ref;

                /**
                 * 🔥 Expected format:
                 * estate_{estateId}_{planId}_{timestamp}
                 */
                if (!tx_ref || !tx_ref.startsWith('estate_')) {
                    return res.status(200).end(); // ignore unrelated payments
                }

                // 🔒 Prevent duplicate processing
                const existing = await Subscription.findOne({
                    where: { reference: tx_ref }
                });

                if (existing) {
                    return res.status(200).end();
                }

                // 🔍 Extract estate + plan
                const [, estateId, planId] = tx_ref.split('_');

                const plan = await Plan.findByPk(planId);
                if (!plan) {
                    return res.status(200).end();
                }

                // 🔐 Capture authorization for auto-renew
                const authorizationCode =
                    data.card?.authorization?.authorization_code || null;

                const startDate = new Date();
                const endDate = new Date(
                    Date.now() + plan.duration_days * 24 * 60 * 60 * 1000
                );

                // 🔍 Check if estate already has subscription
                const existingSub = await Subscription.findOne({
                    where: { estate_id: estateId, status: 'active' }
                });

                if (existingSub) {
                    // 🔁 RENEWAL FLOW (extend existing subscription)
                    existingSub.end_date = new Date(
                        new Date(existingSub.end_date).getTime() +
                        plan.duration_days * 24 * 60 * 60 * 1000
                    );

                    // update authorization if new one exists
                    if (authorizationCode) {
                        existingSub.authorization_code = authorizationCode;
                    }

                    await existingSub.save();

                } else {
                    // 🔄 Expire any old trial/expired records
                    await Subscription.update(
                        { status: 'expired' },
                        {
                            where: {
                                estate_id: estateId,
                                status: ['trial', 'expired']
                            }
                        }
                    );

                    // ✅ NEW SUBSCRIPTION
                    await Subscription.create({
                        estate_id: estateId,
                        plan_id: plan.id,
                        amount: data.amount,
                        reference: tx_ref,
                        authorization_code: authorizationCode,
                        start_date: startDate,
                        end_date: endDate,
                        status: 'active'
                    });
                }
            }
        }

        return res.status(200).end();

    } catch (error) {
        console.error('Webhook error:', error);
        return res.status(500).end();
    }
};