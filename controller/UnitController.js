const Units=require('../models/Units');

exports.createUnits=async(req,res)=>{
    try {
        const {unit_number, plan_id}=req.body;
        const estate_id=req.user.estate_id;
        const occupant_id=req.user.id;

        if(!estate_id){
            return res.status(400).json({message:"Estate not found for user"});
        }

        if(!occupant_id){
            return res.status(400).json({message: "Occupant not found"});
        }

        const createUnit=await Units.create({
            unit_number,
            plan_id,
            estate_id,
            occupant_id
        });

        res.status(200).json({message: "Unit created successfully", createUnit});
    } catch (error) {
        res.status(500).json({message: "Faild to create Units",error: error.message});
    }
}