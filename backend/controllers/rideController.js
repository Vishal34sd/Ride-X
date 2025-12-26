import {validationResult} from "express-validator";
import { getAddressCoordinates, getCaptainInTheRadius } from "../services/mapServices.js";
import { getFareService, createRideService, confirmRideService , startRideService , endRideService } from "../services/rideService.js";
import { sendMessageToSocketId } from "../socket.js";
import rideModel from "../models/rideModel.js";

export const createRide = async (req, res) => {
  try {
    console.log("====== CREATE RIDE HIT ======");

    // 1️⃣ Validation check
    const errors = validationResult(req);
    console.log("VALIDATION ERRORS:", errors.array());

    if (!errors.isEmpty()) {
      console.log("❌ Validation failed");
      return res.status(400).json({ errors: errors.array() });
    }

    // 2️⃣ Check auth user
    console.log("REQ.USER:", req.user);

    if (!req.user) {
      console.log("❌ req.user is NULL");
      return res.status(401).json({ message: "User not authenticated" });
    }

    const { pickup, destination, vehicleType } = req.body;
    console.log("REQUEST BODY:", { pickup, destination, vehicleType });

    // 3️⃣ Create ride
    console.log("Creating ride for user:", req.user._id);

    const ride = await createRideService({
      user: req.user._id,
      pickup,
      destination,
      vehicleType,
      status: "pending",
    });

    console.log("✅ Ride created:", ride);

    // 4️⃣ Send response early (your current logic)
    res.status(201).json({ ride });
    console.log("🚀 Response sent to client");

    // 5️⃣ Get pickup coordinates
    console.log("Fetching coordinates for pickup:", pickup);
    const pickupCoordinates = await getAddressCoordinates(pickup);
    console.log("Pickup coordinates:", pickupCoordinates);

    // 6️⃣ Find nearby captains
    console.log("Searching captains within 2km...");
    const captains = await getCaptainInTheRadius(
      pickupCoordinates.lat,
      pickupCoordinates.lng,
      2,
      { vehicleType }
    );

    console.log("Nearby captains found:", captains.length);

    if (!captains.length) {
      console.log("⚠️ No captains available nearby");
      return;
    }

    // 7️⃣ Populate ride
    const populatedRide = await rideModel
      .findById(ride._id)
      .populate("user", "firstname lastname email");

    console.log("Populated ride:", populatedRide);

    // 8️⃣ Emit socket event
    captains.forEach((captain) => {
      console.log(
        `Captain ${captain._id} socketId:`,
        captain.socketId
      );

      if (captain.socketId) {
        sendMessageToSocketId(captain.socketId, {
          event: "ride-confirmed",
          data: {
            _id: populatedRide._id,
            pickup: populatedRide.pickup,
            destination: populatedRide.destination,
            vehicleType: populatedRide.vehicleType,
            status: populatedRide.status,
            user: populatedRide.user,
          },
        });

        console.log("📡 Ride sent to captain:", captain._id);
      }
    });

  } catch (error) {
    console.error("🔥 CREATE RIDE ERROR:", error);
    return res.status(500).json({ message: "Failed to create ride" });
  }
};

export const getFare = async(req, res)=>{
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({errors: errors.array()});
    }

    const { pickup , destination, vehicleType } = req.query ;
    try{
    console.log("GET FARE QUERY:", { pickup, destination, vehicleType });
      const {distanceKm , durationSeconds , fare, baseFare, perKmRate, distanceCharge, subtotal} = await getFareService({ pickup , destination, vehicleType });
        res.status(200).json({
            fareData: {
                distanceKm,
                durationSeconds,
          fare,
          baseFare,
          perKmRate,
          distanceCharge,
          subtotal
            }
        });
    }
    catch(e){
        console.log(e);
        res.status(404).json({error : "fare not found "});
    }
}

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

    sendMessageToSocketId(ride.user.socketId, {
      event: "ride-confirmed",
      data: ride,
    });

    res.status(200).json({ rideData: ride });
  } catch (error) {
    console.log(error);
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
    console.log(error);
    return res.status(500).json({ message: "Ride decline failed" });
  }
};

export const startRide = async(req , res)=>{
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({errors: errors.array()});
    }

    const {rideId , otp} = req.body;
    try{
        const ride = await startRideService({rideId , otp , captain : req.captain});

        sendMessageToSocketId(req.captain.socketId , {
            event : "ride-started",
            data : ride
        });
        return res.status(200).json({rideData : ride});
    }
    catch(e){
        console.log(e);
    }
}

export const endRide = async(req , res)=>{
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({errors: errors.array()});
    }

    const {rideId} = req.body;
    try{
        const ride = await endRideService({rideId , captain : req.captain});

        sendMessageToSocketId(ride.user.socketId , {
            event : "ride-ended",
            data : ride
        });
        return res.status(200).json({rideData : ride});
    }
    catch(e){
        console.log(e);
    }
}

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
    console.error("Failed to fetch latest ride", error);
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
      .select("pickup destination vehicleType status fare createdAt");

    return res.status(200).json({ rides });
  } catch (error) {
    console.error("Failed to fetch user rides", error);
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
    console.error("Failed to fetch captain ride stats", error);
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
      .select("pickup destination vehicleType status fare createdAt updatedAt")
      .populate("user", "fullname firstname lastname email");

    return res.status(200).json({ rides });
  } catch (error) {
    console.error("Failed to fetch captain rides", error);
    return res.status(500).json({ message: "Failed to fetch captain rides" });
  }
};
