import axios from "axios";
import dotenv from "dotenv";
dotenv.config();
import captainModel from "../models/captainModel.js";
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

/**
 * ═══════════════════════════════════════════════════════════════════
 *  GEOSPATIAL QUERY — Find Captains Within a Radius
 * ═══════════════════════════════════════════════════════════════════
 *
 *  Uses MongoDB's $near operator with the 2dsphere index on
 *  `currentLocation` to efficiently find nearby captains.
 *
 *  FILTERS APPLIED:
 *  1. Geographic proximity — within `radiusKm` kilometers
 *  2. Vehicle type match — only captains with matching vehicleType
 *  3. Availability — only captains where isAvailable === true
 *  4. Active status — only captains with status === "active"
 *  5. Connected — only captains with a valid socketId (online)
 *
 *  HOW IT WORKS:
 *  - MongoDB's $near + $maxDistance uses the 2dsphere index to
 *    perform a sphere-based distance calculation on GeoJSON Points.
 *  - $maxDistance is in METERS, so we convert radiusKm × 1000.
 *  - Results are returned sorted by distance (nearest first).
 *
 *  @param {number} lat        - Pickup latitude
 *  @param {number} lng        - Pickup longitude
 *  @param {number} radiusKm   - Search radius in kilometers (default: 10)
 *  @param {object} filters    - { vehicleType: "car" | "motorcycle" | "auto" }
 *  @returns {Array}           - Array of captain documents within radius
 * ═══════════════════════════════════════════════════════════════════
 */
export const getCaptainInTheRadius = async (lat, lng, radiusKm = 10, filters = {}) => {
    // Convert radius from kilometers to meters (MongoDB $maxDistance uses meters)
    const radiusInMeters = radiusKm * 1000;

    // Build the query with geospatial + availability + vehicle type filters
    const query = {
        // ── Geospatial filter: captains within the specified radius ──
        currentLocation: {
            $near: {
                $geometry: {
                    type: "Point",
                    coordinates: [lng, lat], // GeoJSON: [longitude, latitude]
                },
                $maxDistance: radiusInMeters,
            },
        },

        // ── Only captains who are currently available for rides ──
        isAvailable: true,

        // ── Only captains who are actively online ──
        status: "active",

        // ── Only captains with a valid WebSocket connection ──
        socketId: { $exists: true, $ne: null },
    };

    // ── Filter by vehicle type if specified ──
    if (filters?.vehicleType) {
        query["vehicles.vehicleType"] = filters.vehicleType;
    }

    try {
        const captains = await captainModel.find(query);

        console.log(
            `[GeoQuery] Found ${captains.length} captains within ${radiusKm}km ` +
            `of [${lat}, ${lng}] for vehicleType=${filters?.vehicleType || "any"}`
        );

        return captains;
    } catch (error) {
        console.error(`[GeoQuery] Error finding nearby captains:`, error.message);

        // Fallback: if geospatial index isn't ready, return all matching captains
        // This prevents the system from breaking during initial setup/migration
        console.warn(`[GeoQuery] Falling back to non-geospatial query`);

        const fallbackQuery = {
            socketId: { $exists: true, $ne: null },
            isAvailable: true,
            status: "active",
        };

        if (filters?.vehicleType) {
            fallbackQuery["vehicles.vehicleType"] = filters.vehicleType;
        }

        return await captainModel.find(fallbackQuery);
    }
};
