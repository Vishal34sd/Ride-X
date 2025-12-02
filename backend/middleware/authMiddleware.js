import userModel from "../models/userModel.js"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken";

export const authUser = async(req , res , next)=>{
        const token = req.cookies.token || req.headers.authorization?.split(" ")[1];
        if(!token){
            res.status(404).json({message : "Unauthorized"})
        }

        try{
            const decoded = jwt.verify(token , process.env.JWT_SECRET);
            const user = await userModel.findById(decoded._id);
            req.user = user ;

            return next();
        }
        catch(e){
            console.log(e);
        }
}