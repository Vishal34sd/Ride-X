import express from "express" ;
import {authUser} from "../middleware/authMiddleware.js";
import {query} from "express-validator";
import {getCoordinates , getDistanceTime , getAutoCompleteSuggestions} from "../controllers/mapController.js"

const router = express.Router();

router.get("/get-coordinates" , query("address").isString().isLength({min:3}), getCoordinates );

router.get("/get-distance-time" , 
	query("origin").isString().isLength({min : 3}),
	query("destination").isString().isLength({min : 3}),
	
	getDistanceTime
);

router.get("/get-suggestions" , query("input").isString().isLength({min : 3}),   getAutoCompleteSuggestions);

export default router ;