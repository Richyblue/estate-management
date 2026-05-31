const DataTypes=require("sequelize");
const sequelize=require("../config/db");

const Units=sequelize.define("units",{
    estate_id:{type:DataTypes.INTEGER, allowNull:true},
    unit_number:{type:DataTypes.INTEGER,allowNull:true},
    plan_id:{type:DataTypes.INTEGER,allowNull:true},
    occupant_id:{type:DataTypes.INTEGER,allowNull:true},
});

module.exports=Units;