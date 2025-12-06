import {validationResult} from "express-validator";
import {getAddressCoordinates , getAutoCompleteSuggestions} from "../services/mapServices.js";
import rideModel from "../models/rideModel.js";

export const createRide = async(req , res)=>{
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({errors: errors.array()});
    }

    const {userId , pickup , destination , vehicleType} = req.body;
    try{
        const ride = await createRide({userId : req.userId._id , pickup , destination , vehicleType});
        res.status(201).json({rideData : ride});

        const pickupCoordinates = await getAddressCoordinates(pickup);
        const captainInRadius = await getCaptainInTheRadius(pickupCoordinates.lat , pickupCoordinates.lng , 2);

        const otp = "";

        const rideWithUser = await rideModel.findOne({_id:ride._id}).populate("user");
        capTAINSInRadius.map(captain.socketId , {
            event : "new-ride" ,
            data : rideWithUser
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

    const {pickup , destination } = req.body ;
    try{
        const fair = await getFair(pickup , destination);
        res.status(200).json({fairData : fair})
    }
    catch(e){
        console.log(e);
        res.status(404).json({error : "fair not found "})
    }
}

export const confirmRide = async(req, res) =>{
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({errors: errors.array()});
    }

    const {rideId} = req.body;
    try{
        const ride = await confirmRide({rideId , captain : req.captain});

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
        const ride = await startRide({rideId , otp , captain : req.captain});

        sendMessageToSocketId(captain.socketId , {
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
        const ride = await endRide({rideId , captain : req.captain});

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
