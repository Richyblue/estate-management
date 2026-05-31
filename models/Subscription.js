const DataTypes=require("sequelize");
const sequelize=require("../config/db");

const Subscription=sequelize.define("subscriptions",{
    estate_id:{type:DataTypes.INTEGER, allowNull:true},
    plan_id:{type:DataTypes.INTEGER,allowNull:true},
    amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },

    reference: { type: DataTypes.STRING, unique: true },
    authorization_code: { type: DataTypes.STRING, unique: true },
    state_date:{type:DataTypes.DATE,allowNull:true},
    end_date:{type:DataTypes.DATE,allowNull:true},
    status:{type:DataTypes.STRING,allowNull:true},
});

module.exports=Subscription;