import {body} from "express-validator" ;


export const registerValidator = [
    body("email").isEmail().withMessage("Invalid email"),
    body("fullname.firstname").isLength({min :3}).withMessage("First name should be atleast 3 characters long"),
    body("fullname.lastname").isLength({min :3}).withMessage("last name should be atleast 3 characters long"),
    body("password").isLength({min :6}).withMessage("Password should be atleast 3 characters long"),
    body("vehicle.color").isLength({min:3}).withMessage("Color must be atleast 3 character long"),
    body("vehicle.plate").isLength({min:3}).withMessage("Plate must be atleast 3 character long"),
    body("vehicle.capacity").isLength({min:1}).withMessage("Capacity must be atleast 1 character long"),
    body("vehicle.vehicleType").isIn(["car" , "motorcycle" , "auto"]).withMessage("Invalid vehicle type")
]


export const loginValidator = [
    body("email").isEmail().withMessage("Invalid email"),
    body("password").isLength({min:6}).withMessage("Password should be atleast 6 characters")
] ;