const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const User = require('../models/Users');
const { sendEmail } = require('../utils/emailService');  // Import email service
const { sendSMS } = require('../utils/twilioService');   // Import SMS service
const { generateCode } = require('../utils/codeGenerator'); // Helper for generating codes

// Google Strategy
passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: '/auth/google/callback',
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                // Check if user already exists with Google ID
                const [user, created] = await User.findOrCreate({
                    where: { googleId: profile.id },
                    defaults: { 
                        name: profile.displayName,
                        email: profile.emails[0].value,
                        googleId: profile.id,
                    },
                });

                // Generate and send verification codes for new users
                if (created) {
                    const emailCode = generateCode();
                    const phoneCode = generateCode();

                    user.emailVerificationCode = emailCode;
                    user.phoneVerificationCode = phoneCode;
                    await user.save();

                    // Send email and SMS verification codes
                    await sendEmail(user.email, 'Verify Your Email', `Your email verification code is: ${emailCode}`);
                    await sendSMS(user.phone, `Your phone verification code is: ${phoneCode}`);
                }

                return done(null, user);
            } catch (error) {
                return done(error, null);
            }
        }
    )
);

// Facebook Strategy
passport.use(
    new FacebookStrategy(
        {
            clientID: process.env.FACEBOOK_APP_ID,
            clientSecret: process.env.FACEBOOK_APP_SECRET,
            callbackURL: '/auth/facebook/callback',
            profileFields: ['id', 'emails', 'name'],
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                const email = profile.emails ? profile.emails[0].value : `${profile.id}@facebook.com`;

                // Check if user already exists with Facebook ID
                const [user, created] = await User.findOrCreate({
                    where: { facebookId: profile.id },
                    defaults: { 
                        name: `${profile.name.givenName} ${profile.name.familyName}`,
                        email: email,
                        facebookId: profile.id,
                    },
                });

                // Generate and send verification codes for new users
                if (created) {
                    const emailCode = generateCode();
                    const phoneCode = generateCode();

                    user.emailVerificationCode = emailCode;
                    user.phoneVerificationCode = phoneCode;
                    await user.save();

                    // Send email and SMS verification codes
                    await sendEmail(user.email, 'Verify Your Email', `Your email verification code is: ${emailCode}`);
                    await sendSMS(user.phone, `Your phone verification code is: ${phoneCode}`);
                }

                return done(null, user);
            } catch (error) {
                return done(error, null);
            }
        }
    )
);

// Serialize user for session
passport.serializeUser((user, done) => {
    done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findByPk(id);
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});

module.exports = passport;
