import {validationResult} from "express-validator";
import { getAddressCoordinates, getCaptainInTheRadius } from "../services/mapServices.js";
import { getFareService, createRideService, confirmRideService , startRideService , endRideService } from "../services/rideService.js";
import { sendMessageToSocketId } from "../socket.js";
import rideModel from "../models/rideModel.js";

export const createRide = async(req , res)=>{
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({errors: errors.array()});
    }

    const { pickup , destination , vehicleType} = req.body;
    try{
        const ride = await createRideService({ user: req.user._id , pickup , destination , vehicleType});
        res.status(201).json({rideData : ride});

        const pickupCoordinates = await getAddressCoordinates(pickup);
        const captainInRadius = await getCaptainInTheRadius(pickupCoordinates.lat , pickupCoordinates.lng , 2);

        const rideWithUser = await rideModel.findOne({_id:ride._id}).populate("user");
        captainInRadius.forEach((captain) => {
            if (captain.socketId) {
                sendMessageToSocketId(captain.socketId , {
                    event : "new-ride" ,
                    data : rideWithUser
                });
            }
        });
    }
    catch(e){
        console.log(e);
    }
}

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

export const confirmRide = async(req, res) =>{
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({errors: errors.array()});
    }

    const {rideId} = req.body;
    try{
        const ride = await confirmRideService({rideId , captain : req.captain});

        sendMessageToSocketId(ride.user.socketId , {
            event : "new-ride",
            data : ride
        });
        return res.status(200).json({rideData : ride});
    }
    catch(e){
        console.log(e);
    }
}

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
