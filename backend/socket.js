import { Server } from "socket.io";
import userModel from "./models/userModel.js";
import captainModel from "./models/captainModel.js";

let io;

// Clear stale socketIds on server startup
const clearStaleSocketIds = async () => {
    try {
        const captainResult = await captainModel.updateMany(
            { socketId: { $exists: true, $ne: null } },
            { $unset: { socketId: "" }, $set: { status: "inactive" } }
        );
        const userResult = await userModel.updateMany(
            { socketId: { $exists: true, $ne: null } },
            { $unset: { socketId: "" } }
        );
        console.log(
            `[Socket] Startup cleanup: cleared ${captainResult.modifiedCount} captain + ${userResult.modifiedCount} user stale socketIds`
        );
    } catch (err) {
        console.error(`[Socket] Startup cleanup error:`, err.message);
    }
};

export const initializeSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: [
                "http://localhost:5173",
                "http://127.0.0.1:5173",
                "https://ride-x-one.vercel.app",
            ],
            methods: ["GET", "POST"],
            credentials: true,
        },
    });

    clearStaleSocketIds();

    io.on("connection", (socket) => {
        console.log(`[Socket] New connection: ${socket.id}`);

        // JOIN — Register socket ID for user or captain
        socket.on("join", async ({ userId, userType }) => {
            try {
                if (!userId || !userType) return;

                if (userType === "user") {
                    await userModel.findByIdAndUpdate(userId, { socketId: socket.id });
                    socket.join(`user-${userId}`);
                    console.log(`[Socket] User ${userId} joined`);
                }

                if (userType === "captain") {
                    await captainModel.findByIdAndUpdate(userId, {
                        socketId: socket.id,
                        status: "active",
                        isAvailable: true,
                    });
                    socket.join(`captain-${userId}`);
                    console.log(`[Socket] Captain ${userId} joined`);
                }
            } catch (err) {
                console.error(`[Socket] join error:`, err.message);
            }
        });

        // UPDATE-LOCATION — Captain sends live GPS every 4-5 seconds
        socket.on("update-location", async ({ captainId, location }) => {
            try {
                if (!captainId || !location || location.lat == null || location.lng == null) return;

                const { lat, lng } = location;
                if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return;

                const captain = await captainModel
                    .findById(captainId)
                    .select("lastKnownCoordinates");

                if (!captain) return;

                const newCoords = [lng, lat];
                const oldCoords = captain.lastKnownCoordinates || [0, 0];
                const hasChanged = newCoords[0] !== oldCoords[0] || newCoords[1] !== oldCoords[1];

                if (!hasChanged) return;

                await captainModel.findByIdAndUpdate(captainId, {
                    currentLocation: { type: "Point", coordinates: newCoords },
                    lastKnownCoordinates: newCoords,
                    location: { ltd: lat, lng: lng },
                    locationUpdatedAt: new Date(),
                });

                console.log(`[Socket] Captain ${captainId} location updated`);

                // Forward location to rider if captain has an active ride
                const { default: rideModel } = await import("./models/rideModel.js");

                const activeRide = await rideModel
                    .findOne({
                        captain: captainId,
                        status: { $in: ["confirmed", "ongoing"] },
                    })
                    .populate("user", "socketId")
                    .sort({ updatedAt: -1 });

                if (activeRide && activeRide.user?.socketId) {
                    sendMessageToSocketId(activeRide.user.socketId, {
                        event: "captain-location-update",
                        data: {
                            rideId: activeRide._id,
                            captainLocation: { lat, lng },
                            rideStatus: activeRide.status,
                        },
                    });
                }
            } catch (err) {
                console.error(`[Socket] update-location error:`, err.message);
            }
        });

        // CAPTAIN-ACCEPT-RIDE
        socket.on("captain-accept-ride", async ({ rideId, captainId }) => {
            try {
                if (!rideId || !captainId) return;
                console.log(`[Socket] Captain ${captainId} accepted ride ${rideId}`);
                await captainModel.findByIdAndUpdate(captainId, { isAvailable: false });
            } catch (err) {
                console.error(`[Socket] captain-accept-ride error:`, err.message);
            }
        });

        // CAPTAIN-DECLINE-RIDE
        socket.on("captain-decline-ride", async ({ rideId, captainId }) => {
            try {
                if (!rideId || !captainId) return;
                console.log(`[Socket] Captain ${captainId} declined ride ${rideId}`);
            } catch (err) {
                console.error(`[Socket] captain-decline-ride error:`, err.message);
            }
        });

        // TOGGLE-AVAILABILITY
        socket.on("toggle-availability", async ({ captainId, isAvailable }) => {
            try {
                if (!captainId) return;
                await captainModel.findByIdAndUpdate(captainId, {
                    isAvailable: Boolean(isAvailable),
                });
                console.log(`[Socket] Captain ${captainId} availability: ${isAvailable}`);
            } catch (err) {
                console.error(`[Socket] toggle-availability error:`, err.message);
            }
        });

        // DISCONNECT — Clean up socket references
        socket.on("disconnect", async () => {
            console.log(`[Socket] Disconnected: ${socket.id}`);
            try {
                await userModel.updateMany(
                    { socketId: socket.id },
                    { $unset: { socketId: "" } }
                );
                await captainModel.updateMany(
                    { socketId: socket.id },
                    { $unset: { socketId: "" }, $set: { status: "inactive" } }
                );
            } catch (err) {
                console.error(`[Socket] disconnect cleanup error:`, err.message);
            }
        });
    });
};

export const sendMessageToSocketId = (socketId, message) => {
    if (!io || !socketId) return;

    const targetSocket = io.sockets.sockets.get(socketId);
    if (!targetSocket) return;

    targetSocket.emit(message.event, message.data);
};

export const broadcastRideRequest = (captains, rideData) => {
    if (!io) return;

    let sentCount = 0;

    captains.forEach((captain) => {
        if (captain.socketId) {
            const targetSocket = io.sockets.sockets.get(captain.socketId);
            if (targetSocket) {
                targetSocket.emit("new-ride-request", rideData);
                sentCount++;
            } else {
                // Stale socketId — clean it up
                captainModel.findByIdAndUpdate(captain._id, {
                    $unset: { socketId: "" },
                }).catch(() => {});
            }
        }
    });

    console.log(`[Socket] Ride broadcast to ${sentCount}/${captains.length} captains`);
};

export const getIO = () => io;
