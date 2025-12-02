import express from "express"
import {registerValidator , loginValidator} from "../validators/userValidator.js"
import {registerUser , loginUser} from "../controllers/userController.js"



const router = express.Router();

router.post("/register" ,  registerValidator , registerUser );
router.post("/login" ,loginValidator , loginUser);
// router.get("/profile" , );
// router.get("/logout" , );


export default router ;