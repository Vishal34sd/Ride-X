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
      2
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
        const {distanceKm , durationSeconds , fare} = await getFareService({ pickup , destination, vehicleType });
        res.status(200).json({
            fareData: {
                distanceKm,
                durationSeconds,
                fare
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
    res.status(500).json({ message: "Ride confirmation failed" });
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
        { status: "cancelled" },
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
