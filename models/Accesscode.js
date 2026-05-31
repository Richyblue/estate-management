const DataTypes=require("sequelize");
const sequelize=require("../config/db");

const Accesscode=sequelize.define("accesscodes",{
    code:{type:DataTypes.STRING, allowNull:false},
    estate_id:{type:DataTypes.INTEGER,allowNull:true},
    occupant_id:{type:DataTypes.INTEGER,allowNull:true},
    visitor_name:{type:DataTypes.STRING,allowNull:true},
    status: {
        type: DataTypes.ENUM('pending', 'active', 'used', 'expired'),
        defaultValue: 'pending'
      },
    expires_at:{type:DataTypes.DATE,allowNull:true},
//     entry_time: DataTypes.DATE,
// exit_time: DataTypes.DATE,
// verified_by: DataTypes.INTEGER, // guard id
});

module.exports=Accesscode;