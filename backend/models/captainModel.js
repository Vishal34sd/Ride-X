import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

/**
 * Captain Schema — Represents a driver/captain in the ride-hailing system.
 *
 * KEY DESIGN DECISIONS:
 * 1. `currentLocation` uses GeoJSON "Point" format for MongoDB 2dsphere indexing,
 *    enabling efficient $near geospatial queries to find captains within a radius.
 * 2. `lastKnownCoordinates` stores the previously sent [lng, lat] pair so we can
 *    skip redundant DB writes when the captain hasn't moved (optimization).
 * 3. `isAvailable` flag lets us filter only captains who are free to accept rides.
 * 4. `locationUpdatedAt` tracks when the location was last written to DB.
 */
const captainSchema = new mongoose.Schema({
    fullname: {
        firstname: {
            type: String,
            required: true,
            minLength: [3, "Firstname should be atleast 3 characters long"],
        },
        lastname: {
            type: String,
            required: true,
            minLength: [3, "lastname should be atleast 3 characters"],
        },
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        minLength: [5, "Email should be of atleast 5 characters long"],
        match: [
            /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/,
            "Please enter a valid email address",
        ],
    },
    password: {
        type: String,
        unique: true,
        required: true,
    },
    socketId: {
        type: String,
    },
    status: {
        type: String,
        enum: ["active", "inactive"],
        default: "active",
    },

    /**
     * Whether this captain is currently available to accept new rides.
     * Set to false when captain is already on a ride or manually goes offline.
     */
    isAvailable: {
        type: Boolean,
        default: true,
    },

    vehicles: {
        color: {
            type: String,
            required: true,
            minLength: [3, "Color should be atlest characters long"],
        },
        plate: {
            type: String,
            required: true,
            minLength: [3, "Plate should be atlest characters long"],
        },
        capacity: {
            type: Number,
            required: true,
            minLength: [1, "Capacity should be atleast 1 characters long "],
        },
        vehicleType: {
            type: String,
            required: true,
            enum: ["car", "motorcycle", "auto"],
        },
    },

    /**
     * GeoJSON Point format — required for MongoDB 2dsphere geospatial queries.
     * Coordinates are stored as [longitude, latitude] (GeoJSON standard).
     *
     * This replaces the old { ltd, lng } format which couldn't use geo-indexes.
     */
    currentLocation: {
        type: {
            type: String,
            enum: ["Point"],
            default: "Point",
        },
        coordinates: {
            type: [Number], // [longitude, latitude]
            default: [0, 0],
        },
    },

    /**
     * Cached copy of the last coordinates sent via Socket.IO.
     * Used for the "skip-if-unchanged" optimization — before writing to DB,
     * we compare incoming coords against this value. If identical, we skip
     * the DB update entirely, reducing write load under high concurrency.
     */
    lastKnownCoordinates: {
        type: [Number], // [longitude, latitude]
        default: [0, 0],
    },

    /**
     * Timestamp of the last successful location DB write.
     * Useful for detecting stale/offline captains.
     */
    locationUpdatedAt: {
        type: Date,
        default: null,
    },

    // ── Legacy field (kept for backward compatibility with existing data) ──
    location: {
        ltd: { type: Number },
        lng: { type: Number },
    },
});

/**
 * 2dsphere index on currentLocation — enables $near / $geoWithin queries
 * for finding captains within a geographic radius (e.g., 10 km from pickup).
 */
captainSchema.index({ currentLocation: "2dsphere" });

captainSchema.methods.generateAuthToken = function () {
    const token = jwt.sign({ _id: this._id }, process.env.JWT_SECRET, {
        expiresIn: "24h",
    });
    return token;
};

captainSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

captainSchema.statics.hashPassword = async function (password) {
    return await bcrypt.hash(password, 10);
};

const captainModel = mongoose.model("captain", captainSchema);
export default captainModel;