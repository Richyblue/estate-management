const Estate=require('../models/Estate');

exports.createEstate=async(req,res)=>{
    try {
        const{name,location,plan_id,status,created_by}=req.body;
        const createEsate=await Estate.create({name,location,plan_id,status,created_by});
        res.status(200).json({message:"Estate created successfully", createEsate});

    } catch (error) {
        res.status(500).json({message:"Faild to create Estate", error: error.message});
    }
}