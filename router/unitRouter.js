const router = require('express').Router();
const UnitCountroller = require('../controller/UnitController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/', authMiddleware, UnitCountroller.createUnits );


module.exports=router;
