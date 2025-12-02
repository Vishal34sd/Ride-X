import express from "express"
import {registerValidator , loginValidator} from "../validators/userValidator.js"
import {registerUser , loginUser , getUserProfile , logoutUser} from "../controllers/userController.js"
import {authUser} from "../middleware/authMiddleware.js"


const router = express.Router();

router.post("/register" ,  registerValidator , registerUser );
router.post("/login" ,loginValidator , loginUser);
router.get("/profile" , authUser  , getUserProfile);
router.get("/logout" , authUser , logoutUser );


export default router ;