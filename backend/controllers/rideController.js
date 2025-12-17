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
      2
    );

    if (!captains.length) return;

    
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
    console.error("CREATE RIDE ERROR:", error);
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
