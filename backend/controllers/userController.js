import {validationResult} from "express-validator"
import userModel from "../models/userModel.js"
import {createUser} from "../services/userServices.js"

const registerUser = async(req, res)=>{
    try{
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            return res.status(400).json({errors : errors.array()})
        }

        const {fullname , email , password } = req.body ;
        const isUserAlreadyExists = await  userModel.findOne({email});

        if(isUserAlreadyExists){
            return res.status(400).json({
                message : "user already exists"
            })
        }

        const hashedPassword = await userModel.hashPassword(password);
        const user = await createUser({
            firstname : fullname.firstname ,
            lastname : fullname.lastname ,
            email , 
            password : hashedPassword 
        });

        const token = user.generateAuthToken();
        res.status(200).json({
            userData : user ,
            token : token 
        })
    }
    catch(e){
        console.error(e);
    }
}


const loginUser = async(req, res)=>{
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({
            errors : errors.array()
        })
    }
    const {email , password } = req.body ;
    const user = await userModel.findOne({email}).select("+password");

    if(!user){
        return res.status(400).json({message : "User not found"})
    }

    const isMatched = await user.comparePassword(password);
    if(!isMatched){
        return res.status(400).json({message : "Invalid credentials"})
    }
    const token = user.generateAuthToken();
    return res.status(200).json({
        userData: user,
        token: token
    });
}

export {registerUser, loginUser}