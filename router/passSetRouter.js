
const router = require('express').Router();
const SetPassword = require('../controller/SetPasswordController');

router.post('/forgot-password', SetPassword.forgotPassword);
router.post('/reset-password/:token', SetPassword.resetPassword);

module.exports=router;
