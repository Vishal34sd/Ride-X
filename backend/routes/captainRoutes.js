import express from "express";
import { authCaptain } from "../middleware/authMiddleware.js";
import {
    registerValidator,
    loginValidator,
} from "../validators/captainValidator.js";
import {
    registerCaptain,
    loginCaptain,
    getCaptainProfile,
    logoutCaptain,
} from "../controllers/captainControllers.js";
import { updateCaptainStatus } from "../controllers/rideController.js";

const router = express.Router();

router.post("/register", registerValidator, registerCaptain);
router.post("/login", loginValidator, loginCaptain);
router.get("/profile", authCaptain, getCaptainProfile);
router.get("/logout", authCaptain, logoutCaptain);

/**
 * Toggle captain availability (online/offline for accepting rides).
 * @route PATCH /api/v1/captains/toggle-availability
 * @body { isAvailable: boolean }
 */
router.patch("/toggle-availability", authCaptain, updateCaptainStatus);

export default router;
