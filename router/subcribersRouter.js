const router = require('express').Router();
const subscription = require('../controller/SubscriptionController');
const authMiddleware = require('../middleware/authMiddleware');


router.post('/', authMiddleware, subscription.createSub);


module.exports=router;
