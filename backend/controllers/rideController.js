import { validationResult } from "express-validator";
import {
    getAddressCoordinates,
    getCaptainInTheRadius,
} from "../services/mapServices.js";
import {
    getFareService,
    createRideService,
    confirmRideService,
    startRideService,
    endRideService,
} from "../services/rideService.js";
import { sendMessageToSocketId, broadcastRideRequest } from "../socket.js";
import rideModel from "../models/rideModel.js";
import captainModel from "../models/captainModel.js";

/**
 * ═══════════════════════════════════════════════════════════════════
 *  CREATE RIDE — Full ride creation + captain broadcasting flow
 * ═══════════════════════════════════════════════════════════════════
 *
 *  FLOW:
 *  1. Validate request body (pickup, destination, vehicleType)
 *  2. Create ride document in DB with status "pending"
 *  3. Respond to rider immediately with ride details
 *  4. Geocode the pickup address → get lat/lng coordinates
 *  5. Query MongoDB for captains within 10 km radius using $near
 *     - Only captains with matching vehicleType
 *     - Only captains who are available (isAvailable: true)
 *     - Only captains who are online (have socketId)
 *  6. Broadcast "new-ride-request" via Socket.IO to all eligible captains
 *  7. Captains receive the event and can accept/decline
 * ═══════════════════════════════════════════════════════════════════
 */
export const createRide = async (req, res) => {
    try {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        if (!req.user) {
            return res.status(401).json({ message: "User not authenticated" });
        }

        const { pickup, destination, vehicleType } = req.body;

        // ── Step 1: Create the ride in DB ──
        const ride = await createRideService({
            user: req.user._id,
            pickup,
            destination,
            vehicleType,
            status: "pending",
        });

        // Respond to the rider immediately (don't make them wait for captain search)
        res.status(201).json({ ride });

        // ── Step 2: Geocode pickup address to get coordinates ──
        const pickupCoordinates = await getAddressCoordinates(pickup);

        // ── Step 3: Find nearby captains within 10 km radius ──
        // This uses MongoDB $near with 2dsphere index for efficient geospatial query
        const captains = await getCaptainInTheRadius(
            pickupCoordinates.lat,
            pickupCoordinates.lng,
            50, // 50 km radius
            { vehicleType } // Only matching vehicle type
        );

        if (!captains.length) {
            console.log(`[Ride] No captains found within 10km for ride ${ride._id}`);

            // Notify the rider that no captains are available nearby
            if (req.user.socketId) {
                sendMessageToSocketId(req.user.socketId, {
                    event: "no-captains-available",
                    data: {
                        rideId: ride._id,
                        message: "No captains available near your pickup location. Please try again shortly.",
                    },
                });
            }
            return;
        }

        // ── Step 4: Populate ride with user details for broadcasting ──
        const populatedRide = await rideModel
            .findById(ride._id)
            .populate("user", "fullname firstname lastname email");

        // ── Step 5: Broadcast ride request to all eligible captains ──
        const rideData = {
            _id: populatedRide._id,
            pickup: populatedRide.pickup,
            destination: populatedRide.destination,
            vehicleType: populatedRide.vehicleType,
            fare: populatedRide.fare,
            distance: populatedRide.distance,
            duration: populatedRide.duration,
            status: populatedRide.status,
            user: populatedRide.user,
        };

        // Use the broadcast utility to send to all eligible captains at once
        broadcastRideRequest(captains, rideData);

        console.log(
            `[Ride] Ride ${ride._id} broadcast to ${captains.length} captains ` +
            `(vehicleType: ${vehicleType}, radius: 10km)`
        );
    } catch (error) {
        console.error(`[Ride] createRide error:`, error.message);
        // Only send error response if headers haven't been sent yet
        if (!res.headersSent) {
            return res.status(500).json({ message: "Failed to create ride" });
        }
    }
};

export const getFare = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { pickup, destination, vehicleType } = req.query;
    try {
        const {
            distanceKm,
            durationSeconds,
            fare,
            baseFare,
            perKmRate,
            distanceCharge,
            subtotal,
        } = await getFareService({ pickup, destination, vehicleType });
        res.status(200).json({
            fareData: {
                distanceKm,
                durationSeconds,
                fare,
                baseFare,
                perKmRate,
                distanceCharge,
                subtotal,
            },
        });
    } catch (e) {
        const message = e?.message || "Fare calculation failed";
        res.status(500).json({ message });
    }
};

/**
 * CONFIRM RIDE — Captain confirms/accepts an incoming ride request.
 * - Validates captain's vehicle type matches the ride type
 * - Updates ride status to "confirmed" and assigns captain
 * - Marks captain as unavailable (isAvailable: false)
 * - Notifies the rider via Socket.IO
 */
export const confirmRide = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { rideId } = req.body;

    try {
        const ride = await confirmRideService({
            rideId,
            captain: req.captain,
        });

        // Mark captain as unavailable since they've taken this ride
        await captainModel.findByIdAndUpdate(req.captain._id, {
            isAvailable: false,
        });

        // Notify the rider that their ride has been confirmed
        sendMessageToSocketId(ride.user.socketId, {
            event: "ride-confirmed",
            data: ride,
        });

        res.status(200).json({ rideData: ride });
    } catch (error) {
        const message = error?.message || "Ride confirmation failed";
        const status = message.includes("does not match") ? 400 : 500;
        res.status(status).json({ message });
    }
};

export const declineRide = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { rideId } = req.body;

    try {
        const ride = await rideModel
            .findByIdAndUpdate(
                rideId,
                { status: "cancelled", captain: req.captain?._id },
                { new: true }
            )
            .populate("user");

        if (!ride) {
            return res.status(404).json({ message: "Ride not found" });
        }

        if (ride.user?.socketId) {
            sendMessageToSocketId(ride.user.socketId, {
                event: "ride-declined",
                data: ride,
            });
        }

        return res.status(200).json({ rideData: ride });
    } catch (error) {
        return res.status(500).json({ message: "Ride decline failed" });
    }
};

export const startRide = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { rideId, otp } = req.body;
    try {
        const ride = await startRideService({
            rideId,
            otp,
            captain: req.captain,
        });

        sendMessageToSocketId(req.captain.socketId, {
            event: "ride-started",
            data: ride,
        });
        return res.status(200).json({ rideData: ride });
    } catch (e) {
    }
};

/**
 * END RIDE — Captain completes an ongoing ride.
 * - Marks ride as "completed"
 * - Sets captain back to isAvailable: true so they can accept new rides
 * - Notifies the rider
 */
export const endRide = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { rideId } = req.body;
    try {
        const ride = await endRideService({ rideId, captain: req.captain });

        // Mark captain as available again after completing the ride
        await captainModel.findByIdAndUpdate(req.captain._id, {
            isAvailable: true,
        });

        sendMessageToSocketId(ride.user.socketId, {
            event: "ride-ended",
            data: ride,
        });
        return res.status(200).json({ rideData: ride });
    } catch (e) {
    }
};

export const getLatestRide = async (req, res) => {
    try {
        const ride = await rideModel
            .findOne({ user: req.user._id })
            .sort({ createdAt: -1 })
            .select("pickup destination vehicleType status createdAt");

        if (!ride) {
            return res.status(404).json({ message: "No rides found" });
        }

        return res.status(200).json({ ride });
    } catch (error) {
        return res.status(500).json({ message: "Failed to fetch latest ride" });
    }
};

export const getUserRides = async (req, res) => {
    try {
        if (!req.user || !req.user._id) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const rides = await rideModel
            .find({ user: req.user._id })
            .sort({ createdAt: -1 })
            .select(
                "pickup destination vehicleType status fare duration distance createdAt"
            );

        return res.status(200).json({ rides });
    } catch (error) {
        return res.status(500).json({ message: "Failed to fetch user rides" });
    }
};

export const getCaptainRideStats = async (req, res) => {
    try {
        if (!req.captain || !req.captain._id) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const totalRides = await rideModel.countDocuments({
            captain: req.captain._id,
        });

        return res.status(200).json({ totalRides });
    } catch (error) {
        return res
            .status(500)
            .json({ message: "Failed to fetch captain ride stats" });
    }
};

export const getCaptainRides = async (req, res) => {
    try {
        if (!req.captain || !req.captain._id) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const rides = await rideModel
            .find({ captain: req.captain._id })
            .sort({ createdAt: -1 })
            .select(
                "pickup destination vehicleType status fare createdAt updatedAt"
            )
            .populate("user", "fullname firstname lastname email");

        return res.status(200).json({ rides });
    } catch (error) {
        return res
            .status(500)
            .json({ message: "Failed to fetch captain rides" });
    }
};

/**
 * UPDATE CAPTAIN STATUS — Toggle captain availability via REST API.
 * Alternative to the Socket.IO "toggle-availability" event.
 *
 * @route PATCH /api/v1/captains/toggle-availability
 * @body { isAvailable: boolean }
 */
export const updateCaptainStatus = async (req, res) => {
    try {
        const { isAvailable } = req.body;

        if (typeof isAvailable !== "boolean") {
            return res
                .status(400)
                .json({ message: "isAvailable must be a boolean" });
        }

        const captain = await captainModel.findByIdAndUpdate(
            req.captain._id,
            { isAvailable },
            { new: true }
        );

        return res.status(200).json({
            captain: {
                _id: captain._id,
                isAvailable: captain.isAvailable,
                status: captain.status,
            },
        });
    } catch (error) {
        return res
            .status(500)
            .json({ message: "Failed to update captain status" });
    }
};
