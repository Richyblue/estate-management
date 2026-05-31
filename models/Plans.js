const DataTypes=require("sequelize");
const sequelize=require("../config/db");

const Plans=sequelize.define("plans",{
    name:{type:DataTypes.STRING, allowNull:true},
    price:{type:DataTypes.STRING,allowNull:true},
    max_users:{type:DataTypes.STRING,allowNull:true},
    duration_days: { type: DataTypes.INTEGER, allowNull: false },

    trial_days: { type: DataTypes.INTEGER, defaultValue: 7 },
    features:{type:DataTypes.JSON,allowNull:true},
});

module.exports=Plans;