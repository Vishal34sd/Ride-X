import mongoose from "mongoose";
import bcrypt from "bcrypt" ;
import jwt from "jsonwebtoken";

const captainSchema = new mongoose.Schema({
    fullname : {
        firstname : {
            type : String ,
            required : true ,
            minLength : [3 , "Firstname should be atleast 3 characters long"]
        } ,
        lastname : {
            type : String ,
            required : true ,
            minLength : [3 , "lastname should be atleast 3 characters"]
        }
    },
    email : {
        type : String ,
        required : true ,
        unique : true ,
        lowercase : true ,
        minLength : [5 , "Email should be of atleast 5 characters long"],
        match : [/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/,
      "Please enter a valid email address"]
    } , 
    password : {
        type : String ,
        unique : true ,
        required : true ,
        

    },
    socketId : {
        type : String 
    },
    status : {
        type : String ,
        enum : ["active" , "inactive"],
        default : "active"
    } ,
    vehicles : {
        color : {
            type : String ,
            required : true ,
            minLength : [3 , "Color should be atlest characters long"]
        } ,
        plate : {
            type : String ,
            required : true ,
            minLength : [3 , "Plate should be atlest characters long"]
        } ,
        capacity : {
            type : Number ,
            required : true ,
            minLength : [1 , "Capacity should be atleast 1 characters long "]
        },
        vehicleType : {
            type : String ,
            required : true ,
            enum : ["car" , "motorcycle" , "auto"]
        }
    } ,
    location : {
        ltd : {
            type : Number 
        },
        lng : {
            type : Number 
        }
    }

});

captainSchema.methods.generateAuthToken = function (){
    const token = jwt.sign({_id:this._id} , process.env.JWT_SECRET , {expiresIn : "24h"});
    return token ;
}

captainSchema.methods.comparePassword = async function(enteredPassword){
    return await bcrypt.compare(enteredPassword , this.password);
}

captainSchema.statics.hashPassword = async function (password){
    return await bcrypt.hash(password , 10);
}

const captainModel = mongoose.model("captain",captainSchema);
export default captainModel ;