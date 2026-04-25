/**
 * ═══════════════════════════════════════════════════════════════════
 *  DATABASE MIGRATION SCRIPT
 * ═══════════════════════════════════════════════════════════════════
 *
 *  Migrates existing captain documents from the old location format:
 *    { location: { ltd: Number, lng: Number } }
 *
 *  To the new GeoJSON format required for 2dsphere geospatial queries:
 *    { currentLocation: { type: "Point", coordinates: [lng, lat] } }
 *
 *  Also sets default values for new fields:
 *    - isAvailable: true
 *    - lastKnownCoordinates: [0, 0]
 *    - locationUpdatedAt: null
 *
 *  USAGE: node scripts/migrateLocations.js
 *
 *  This script is SAFE to run multiple times — it only updates
 *  captains that haven't been migrated yet (no currentLocation).
 * ═══════════════════════════════════════════════════════════════════
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "..", ".env") });

import captainModel from "../models/captainModel.js";

const migrateLocations = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URL);
        console.log("✅ Connected to MongoDB");

        // Find captains with old location format that haven't been migrated
        const captains = await captainModel.find({
            "location.ltd": { $exists: true },
            $or: [
                { "currentLocation.coordinates": { $exists: false } },
                { "currentLocation.coordinates": [0, 0] },
            ],
        });

        console.log(`📋 Found ${captains.length} captains to migrate`);

        let migrated = 0;
        let skipped = 0;

        for (const captain of captains) {
            const lat = captain.location?.ltd;
            const lng = captain.location?.lng;

            if (lat != null && lng != null && (lat !== 0 || lng !== 0)) {
                await captainModel.findByIdAndUpdate(captain._id, {
                    currentLocation: {
                        type: "Point",
                        coordinates: [lng, lat],
                    },
                    lastKnownCoordinates: [lng, lat],
                    isAvailable: captain.isAvailable ?? true,
                    locationUpdatedAt: new Date(),
                });
                migrated++;
                console.log(
                    `  ✅ Captain ${captain._id} → [${lat}, ${lng}]`
                );
            } else {
                skipped++;
                console.log(
                    `  ⏭️  Captain ${captain._id} → skipped (no valid coords)`
                );
            }
        }

        // Ensure the 2dsphere index exists
        await captainModel.collection.createIndex(
            { currentLocation: "2dsphere" },
            { background: true }
        );
        console.log(`\n✅ 2dsphere index ensured on currentLocation`);

        console.log(`\n═══════════════════════════════════════════════`);
        console.log(`  Migration complete!`);
        console.log(`  Migrated: ${migrated}`);
        console.log(`  Skipped:  ${skipped}`);
        console.log(`  Total:    ${captains.length}`);
        console.log(`═══════════════════════════════════════════════\n`);

        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error("❌ Migration failed:", error.message);
        await mongoose.disconnect();
        process.exit(1);
    }
};

migrateLocations();
