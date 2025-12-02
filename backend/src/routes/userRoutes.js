import express from "express"
import {registerValidator} from "../validators/userValidator.js"


const router = express.Router();

router.post("/register" ,  registerValidator , );
router.post("/login" , );
router.get("/profile" , );
router.get("/logout" , );


export default router ;