const DataTypes=require("sequelize");
const sequelize=require("../config/db");

const Estate=sequelize.define("estate",{
    name:{type:DataTypes.STRING, allowNull:true},
    location:{type:DataTypes.STRING,allowNull:true},
    plan_id:{type:DataTypes.INTEGER,allowNull:true},
    status:{type:DataTypes.STRING,allowNull:true},
    created_by:{type:DataTypes.STRING,allowNull:true}
});

module.exports=Estate;