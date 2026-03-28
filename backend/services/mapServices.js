import axios from "axios";
import dotenv from "dotenv";
dotenv.config() ;
import captainModel from "../models/captainModel.js"
const NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org";
const ORS_KEY = process.env.ORS_API_KEY;

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
        throw error;
    }
};


export const getDistanceAndTime = async (origin, destination) => {
    try {
        if (!ORS_KEY) {
            throw new Error("ORS_API_KEY is missing. Check backend/.env loading and server start directory.");
        }

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
            distanceMeters: data.distance,     
            durationSeconds: data.duration     
        };

    } catch (error) {
        throw error;
    }
};



export const getAutoCompleteResults = async (input) => {
    if (!ORS_KEY) {
        throw new Error("ORS_API_KEY is missing. ");
    }

    const url = `https://api.openrouteservice.org/geocode/autocomplete`;

    try {
        const response = await axios.get(url, {
            params: {
                api_key: ORS_KEY,
                text: input,
                size: 5,
            },
        });

        const features = response.data?.features || [];

        return features.map((feature) => ({
            name: feature.properties?.label || feature.properties?.name || "Unknown",
            lat: feature.geometry?.coordinates?.[1],
            lng: feature.geometry?.coordinates?.[0],
        }));

    } catch (error) {
        throw error;
    }
};

export const getCaptainInTheRadius = async (lat, lng, radiusKm, filters = {}) => {
    const query = {
        socketId: { $exists: true, $ne: null },
    };

    if (filters?.vehicleType) {
        query["vehicles.vehicleType"] = filters.vehicleType;
    }

    const captains = await captainModel.find(query);
    return captains;
};
