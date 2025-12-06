import express from "express" ;
import {body , query} from "express-validator";
import {authUser , authCaptain} from "../middleware/authMiddleware.js";
import {rideFairValidation , rideValidation} from "../validators/rideValidation.js"
const router = express.Router();


router.post("/create" , rideValidation , authUser ,  createRide);

router.get("/get-fare" , rideFairValidation , authUser ,getFair );

router.post("/confirm"  , authCaptain , body("rideId").isMongoId().withMessage("Invalid ride id ") , confirmRide);

router.get("/start-ride" , authCaptain , query("rideId").isMongoId().withmEssage("Invalid rideId") , 
query("otp").isString().withLength({min : 6 , max:6}).withMessage("invalid otp" , startRide));

router.post("/end-ride" , authCaptain , body("rideId").isMongoId().withMessage("inavalid ride id ") , endRide);
export default router ;