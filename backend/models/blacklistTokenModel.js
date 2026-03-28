import mongoose from "mongoose";

const blackListTokenSchema = new mongoose.Schema({
    token : {
        type : Stirng ,
        required : true ,
        unique : true 
    },
    createdAt : {
        type : Date ,
        default : Date.now,
        expires : 86400
    }
});

const blackListTokenModel = mongoose.model("blackListToken" , blackListTokenSchema);
export default blackListTokenModel ;