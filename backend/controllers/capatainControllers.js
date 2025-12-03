import captainModel from "../models/captainModel";
import { validationResult } from "express-validator";


const registerCaptain = async(req, res)=>{
    try{
        const error = validationResult();
        if(!error.isEmpty()){
            return res.status(400).json({error : error.array()})
        }

        const {fullname , email , password , vehicle} = req.body ;

        const isCaptainExists = await captainModel.findOne({email});
        if(isCaptainExists){
            res.status(400).json({message : "Capataiun already exists "})
        }

        const hashedPassword = await captainModel.hashedPassword(password);

        const captain = await createCaptain({
            firstname : fullname.firstname,
            lastname : fullname.lastname ,
            email ,
            password : hashedPassword ,
            color : vehicle.color ,
            plate : vehicle.plate ,
            capacity : vehicle.capacity ,
            vehicleType : vehicle.vehicleType 
        });

        const token = captain.generateAuthToken();
        res.status(200).json({
            captainData : captain ,
            token : token 
        })
    }
    catch(e){
        console.log(e);
    }
}

export {registerCaptain};