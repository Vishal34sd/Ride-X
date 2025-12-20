import userModel from "../models/userModel.js"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken";
import captainModel from "../models/captainModel.js"

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


export const authCaptain = async (req, res, next) => {
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1];

    if (!token) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const captain = await captainModel.findById(decoded._id);

        if (!captain) {
            return res.status(401).json({ message: "Captain not found" });
        }

        req.captain = captain;
        return next();
    } catch (e) {
        console.log(e);
        return res.status(401).json({ message: "Unauthorized" });
    }
};