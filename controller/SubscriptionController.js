const Subscription=require('../models/Subscription');

exports.createSub=async(req,res)=>{
    try {
      const {plan_id, status}=req.body;
      const estate_id=req.user.estate_id;
      if (!estate_id) {
        return res.status(400).json({ message: 'Estate not found for user' });
    }

    const start_date = new Date();

    // Example: 30 days plan
    const end_date = new Date();
    end_date.setDate(end_date.getDate() + 30); 
    const subscription = await Subscription.create({
        estate_id,
        plan_id,
        start_date,
        end_date,
        status
    }); 

    res.status(200).json({message: "Subscription created successfully",subscription});
    } catch (error) {
        res.status(500).json({message:"Faild to create subscriptions",error: error.message});
    }
}