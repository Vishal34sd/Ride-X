import axios from "axios";
import dotenv from "dotenv";
dotenv.config() ;
import captainModel from "../models/captainModel.js"
const NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org";
const ORS_KEY = process.env.ORS_API_KEY;


// 1️⃣ Get Coordinates (address → lat,lng)
export const getAddressCoordinates = async (address) => {
    const url = `${NOMINATIM_BASE_URL}/search?format=json&q=${encodeURIComponent(address)}&limit=1`;

    try {
        const response = await axios.get(url, {
            headers: {
                "User-Agent": "uber-project"  
            }
        });

        if (response.data.length === 0) {
            throw new Error("No location found");
        }

        const loc = response.data[0];

        return {
            lat: parseFloat(loc.lat),
            lng: parseFloat(loc.lon),
            displayName: loc.display_name
        };

    } catch (error) {
        console.log("Coordinate Error:", error.message);
        throw error;
    }
};


export const getDistanceAndTime = async (origin, destination) => {
    try {
        const originCoords = await getAddressCoordinates(origin);
        const destinationCoords = await getAddressCoordinates(destination);

        const url = `https://api.openrouteservice.org/v2/directions/driving-car`;

        const response = await axios.post(
            url,
            {
                coordinates: [
                    [originCoords.lng, originCoords.lat],
                    [destinationCoords.lng, destinationCoords.lat]
                ]
            },
            {
                headers: {
                    "Authorization": ORS_KEY,
                    "Content-Type": "application/json"
                }
            }
        );

        const data = response.data.routes[0].summary;

        return {
            distanceMeters: data.distance,     // 👈 REQUIRED BY FARE SERVICE
            durationSeconds: data.duration     // optional
        };

    } catch (error) {
        console.log("Distance-Time Error:", error.message);
        throw error;
    }
};


// 3️⃣ Autocomplete Suggestions
export const getAutoCompleteResults = async (input) => {
    const url = `${NOMINATIM_BASE_URL}/search?format=json&q=${encodeURIComponent(input)}&limit=5&addressdetails=1`;

    try {
        const response = await axios.get(url, {
            headers: {
                "User-Agent": "YourAppName/1.0"
            }
        });

        return response.data.map((item) => ({
            name: item.display_name,
            lat: item.lat,
            lng: item.lon
        }));

    } catch (error) {
        console.log("Suggestion Error:", error.message);
        throw error;
    }
};

export const getCaptainInTheRadius = async(ltd , lng , radius)=>{
    const captains = await captainModel.find({
        location : {
            $geoWithin:{
                $centerSphere : [[lng , ltd] , radius/6378.1]
            }
        }
    });
    return captains ;
}
