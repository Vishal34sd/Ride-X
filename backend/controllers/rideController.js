import {validationResult} from "express-validator";
import { getAddressCoordinates, getCaptainInTheRadius } from "../services/mapServices.js";
import { getFareService, createRideService, confirmRideService , startRideService , endRideService } from "../services/rideService.js";
import { sendMessageToSocketId } from "../socket.js";
import rideModel from "../models/rideModel.js";

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

    const ride = await createRideService({
      user: req.user._id,
      pickup,
      destination,
      vehicleType,
      status: "pending",
    });
    res.status(201).json({ ride });
    const pickupCoordinates = await getAddressCoordinates(pickup);
    const captains = await getCaptainInTheRadius(
      pickupCoordinates.lat,
      pickupCoordinates.lng,
      2,
      { vehicleType }
    );

    if (!captains.length) {
      return;
    }

    const populatedRide = await rideModel
      .findById(ride._id)
      .populate("user", "firstname lastname email");
    captains.forEach((captain) => {
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
      }
    });
  } catch (error) {
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
      const message = e?.message || "Fare calculation failed";
      res.status(500).json({ message });
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
      .select("pickup destination vehicleType status fare createdAt updatedAt")
      .populate("user", "fullname firstname lastname email");

    return res.status(200).json({ rides });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch captain rides" });
  }
};
