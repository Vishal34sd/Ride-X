import express from "express";
import {authCaptain } from "../middleware/authMiddleware.js";
import {registerValidator , loginValidator} from "../validators/captainValidator.js"
import {registerCaptain , loginCaptain , getCaptainProfile , logoutCaptain} from "../controllers/captainControllers.js"

const router = express.Router();


router.post("/register" , registerValidator , registerCaptain );
router.post("/login" , loginValidator , loginCaptain );
router.get("/profile" , authCaptain , getCaptainProfile);
router.get("/logout" ,authCaptain , logoutCaptain  );


export default router ; 
