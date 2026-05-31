const router = require('express').Router();
const emailVerifycontroller = require('../controller/verifyEmailController');

router.get('/verify-email/:token', emailVerifycontroller.verifyEmail);

module.exports=router;