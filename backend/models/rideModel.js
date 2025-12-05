import mongoose from "mongoose";


const rideSchema = new Mongoose({
    user : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "user",
        required : true
    },
    captain : {
        type : mongoose.Schema.Types.ObjectId ,
        ref : "captain"
    },
    pickup : {
        type : String ,
        required : true ,

    },
    destination : {
        type : String ,
        required : true
    },
    fare : {
        type : Number ,
        required : true 
    },
    status : {
        type : String ,
        enum : ["pending" , "accepted" , "completed", "cancelled" , "ongoing"],
        default : "pending"
    },
    duration : {
        type : Number ,

    },
    distance : {
        type : Number ,

    },
    paymentId : {
        type : String
    },
    orderId : {
        type : String
    },
    signature : {
        type : String
    },
    otp : {
        type : Number,
        select : false,
        required : true 
    }
}, {timestamps : true})

const rideModel = mongoose.model("ride", rideSchema);
export default rideModel ;