const DataTypes=require("sequelize");
const sequelize=require("../config/db");

const User=sequelize.define("user",{
    fullname:{type:DataTypes.STRING, allowNull:true},
    email:{type:DataTypes.STRING,allowNull:true, unique:true},
    password:{type:DataTypes.STRING,allowNull:false},
    estate_id:{type:DataTypes.STRING,allowNull:true},
    role:{type:DataTypes.STRING,allowNull:true},
    email_verified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      email_verification_token: {
        type: DataTypes.STRING
      },
    reset_password_token: {
        type: DataTypes.STRING,
        allowNull: true
      },
      reset_password_expires: {
        type: DataTypes.DATE,
        allowNull: true
      }
});

module.exports=User;