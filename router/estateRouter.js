const express=require("express");
const router=express.Router();
const Estate=require("../controller/EstateController");
const authMiddleware=require("../middleware/authMiddleware");

router.post('/estate', authMiddleware, Estate.createEstate );

module.exports=router;
