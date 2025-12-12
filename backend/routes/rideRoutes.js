import express from "express" ;
import {body , query} from "express-validator";
import {authUser , authCaptain} from "../middleware/authMiddleware.js";
import {rideFairValidation , rideValidation} from "../validators/rideValidation.js";
import { createRide, getFare, confirmRide, startRide, endRide } from "../controllers/rideController.js";

const router = express.Router();

router.post("/create" , rideValidation , authUser ,  createRide);

router.get(
  "/get-fare",
  [
    query("pickup").notEmpty().isLength({ min: 3 }),
    query("destination").notEmpty().isLength({ min: 3 }),
    query("vehicleType").notEmpty(),
  ],
  getFare
);


router.post("/confirm"  , 
	authCaptain , 
	body("rideId").isMongoId().withMessage("Invalid ride id ") , 
	confirmRide
);

router.get("/start-ride" , 
	authCaptain , 
	query("rideId").isMongoId().withMessage("Invalid rideId") , 
	query("otp").isString().isLength({min : 6 , max:6}).withMessage("invalid otp") , 
	startRide
);

router.post("/end-ride" , 
	authCaptain , 
	body("rideId").isMongoId().withMessage("invalid ride id") , 
	endRide
);

export default router ;