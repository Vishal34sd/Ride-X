import userModel from "../models/userModel.js";
import rideModel from "../models/rideModel.js";
import { getDistanceAndTime } from "./mapServices.js";

export const getFareService = async ({ pickup, destination, vehicleType }) => {
    if (!pickup || !destination) {
        throw new Error("Pickup and destination are required");
    }

    const normalizedVehicleType = String(vehicleType || "").toLowerCase().trim();

    // Keep allowed vehicle types consistent with rideValidation
    // and captainModel (car, motorcycle, auto)
    const allowedVehicles = ["auto", "car", "motorcycle"];
    if (!normalizedVehicleType || !allowedVehicles.includes(normalizedVehicleType)) {
        throw new Error("Invalid or missing vehicle type");
    }

    // base fare and per km for each vehicle
    const baseFare = {
        auto: 30,
        car: 50,
        motorcycle: 20,
    };

    const perKmRate = {
        auto: 10,
        car: 15,
        motorcycle: 8,
    };

    // get distance from your map service
    const { distanceMeters , durationSeconds } = await getDistanceAndTime(pickup, destination);
    const distanceKm = distanceMeters / 1000;

    const selectedBaseFare = baseFare[normalizedVehicleType];
    const selectedPerKmRate = perKmRate[normalizedVehicleType];

    const distanceCharge = selectedPerKmRate * distanceKm;
    const rawFare = selectedBaseFare + distanceCharge;

    const roundMoney = (value) => {
        const n = Number(value);
        if (!Number.isFinite(n)) {
            throw new Error("Fare calculation failed: invalid numeric value");
        }
        return Math.round(n * 100) / 100;
    };
    const fare = roundMoney(rawFare);
    const subtotal = roundMoney(selectedBaseFare + distanceCharge);

    return {
        distanceKm,
        durationSeconds,
        fare,
        // breakdown values for UI (kept consistent with backend)
        baseFare: roundMoney(selectedBaseFare),
        perKmRate: roundMoney(selectedPerKmRate),
        distanceCharge: roundMoney(distanceCharge),
        subtotal,
    };
};

export const generateOtp = () => {
    // 6 digit numeric OTP between 100000 and 999999
    const min = 100000;
    const max = 999999;
    const otp = Math.floor(Math.random() * (max - min + 1)) + min;
    return otp.toString();
}

export const createRideService = async ({
  user,
  pickup,
  destination,
  vehicleType,
}) => {
  const fareData = await getFareService({
    pickup,
    destination,
    vehicleType,
  });

  const ride = await rideModel.create({
    user,
    pickup,
    destination,
        vehicleType,
    fare: fareData.fare,
    distance: fareData.distanceKm,
    duration: fareData.durationSeconds,
    status: "pending",
  });

  return ride;
};

export const confirmRideService = async({rideId , captain})=>{
    const ride = await rideModel.findById(rideId);
    if (!ride) {
        throw new Error("Ride not found");
    }

    const captainVehicleType = captain?.vehicles?.vehicleType;
    if (!captainVehicleType) {
        throw new Error("Captain vehicle type is missing");
    }

    if (ride.vehicleType !== captainVehicleType) {
        throw new Error("Captain vehicle type does not match ride type");
    }

    await rideModel.findOneAndUpdate(
        { _id: rideId },
        {
			status : "confirmed",
            captain : captain._id
        }
    );

    const populatedRide = await rideModel.findOne({
        _id :rideId,
        captain : captain._id
    }).populate("user").populate("captain");

    return populatedRide ;
}

export const startRideService = async({rideId , otp , captain})=>{
    const ride = await rideModel.findOne({
        _id :rideId,
        captain : captain._id
    }).populate("user").populate("captain");

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
    }).populate("user").populate("captain");

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