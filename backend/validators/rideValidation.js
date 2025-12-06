import { body } from "express-validator";

export const rideValidation = [
  body("pickup")
    .trim()
    .notEmpty().withMessage("Pickup location is required")
    .isLength({ min: 3 }).withMessage("Pickup must be at least 3 characters long"),

  body("destination")
    .trim()
    .notEmpty().withMessage("Destination is required")
    .isLength({ min: 3 }).withMessage("Destination must be at least 3 characters long"),

  body("vehicleType")
    .notEmpty().withMessage("Vehicle type is required")
    .isIn(["car", "motorcycle", "auto"]).withMessage("Invalid vehicle type"),
];

export const rideFairValidation = [
   body("pickup")
    .trim()
    .notEmpty().withMessage("Pickup location is required")
    .isLength({ min: 3 }).withMessage("Pickup must be at least 3 characters long"),

  body("destination")
    .trim()
    .notEmpty().withMessage("Destination is required")
    .isLength({ min: 3 }).withMessage("Destination must be at least 3 characters long")
]
