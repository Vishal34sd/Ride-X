import userModel from "../models/userModel.js";
import rideModel from "../models/rideModel.js";
import { getDistanceAndTime } from "./mapServices.js";

export const getFareService = async ({ pickup, destination, vehicleType }) => {
    if (!pickup || !destination) {
        throw new Error("Pickup and destination are required");
    }

    const allowedVehicles = ["auto", "car", "bike"];
    if (!vehicleType || !allowedVehicles.includes(vehicleType)) {
        throw new Error("Invalid or missing vehicle type");
    }

    // base fare and per km for each vehicle
    const baseFare = {
        auto: 30,
        car: 50,
        bike: 20,
    };

    const perKmRate = {
        auto: 10,
        car: 15,
        bike: 8,
    };

    // get distance from your map service
    const { distanceMeters , durationSeconds } = await getDistanceAndTime(pickup, destination);
    const distanceKm = distanceMeters / 1000;

    const rawFare = baseFare[vehicleType] + perKmRate[vehicleType] * distanceKm;

    
    const fare = Math.round(rawFare * 100) / 100;

    return {distanceKm , durationSeconds , fare};
};

export const generateOtp = () => {
    // 6 digit numeric OTP between 100000 and 999999
    const min = 100000;
    const max = 999999;
    const otp = Math.floor(Math.random() * (max - min + 1)) + min;
    return otp.toString();
}

export const createRideService = async({ user , pickup , destination , vehicleType})=>{
    const fare = await getFareService({ pickup , destination, vehicleType });

    const ride = await rideModel.create({
        user ,
        pickup , 
        destination ,
        vehicleType ,
        otp : generateOtp(),
        fare
    });
    return ride ;
}

export const confirmRideService = async({rideId , captain})=>{
    await rideModel.findOneAndUpdate({
        _id: rideId
    } , {
        status : "accepted",
        captain : captain._id
    })

    const ride = await rideModel.findOne({
        _id :rideId,
        captain : captain._id
    }).populate("user").populate("captain".select("+otp"));

    return ride ;
}

export const startRideService = async({rideId , otp , captain})=>{
    const ride = await rideModel.findOne({
        _id :rideId,
        captain : captain._id
    }).populate("user").populate("captain".select("+otp"));

    await rideModel.findOneAndUpdate({
        _id :rideId
    },{
        status : "ongoing"
    });

    return ride ;
}

export const endRideService = async({rideId , captain})=>{
    if(!rideId){
        throw new Error("rideId is required");
    }

    if(!captain || !captain._id){
        throw new Error("Valid captain is required");
    }

    const ride = await rideModel.findOne({
        _id : rideId,
        captain : captain._id
    }).populate("user").populate("captain".select("+otp"));

    if(!ride){
        throw new Error("Ride not found for this captain");
    }

    if(ride.status !== "ongoing"){
        throw new Error("Ride must be ongoing to be completed");
    }

    ride.status = "completed";
    await ride.save();

    return ride ;
}