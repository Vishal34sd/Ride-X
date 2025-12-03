import express from "express";
import {authUser } from "../middleware/authMiddleware.js";
import {registerValidator} from "../validators/captainValidator.js"
import {loginValidator} from "../validators/captainValidator.js"

const router = express.Router();


router.post("/register" , registerValidator , registerCaptain );
router.post("/login" , loginValidator , loginCapatain );
router.get("/profile" , );
router.get("/logout" , );


export default router ; 
