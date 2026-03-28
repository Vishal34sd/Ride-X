import { Server } from "socket.io";
import userModel from "./models/userModel.js";
import captainModel from "./models/captainModel.js";

let io;

export const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    socket.on("join", async ({ userId, userType }) => {
      try {
        if (!userId || !userType) {
          return;
        }

        if (userType === "user") {
          await userModel.findByIdAndUpdate(userId, {
            socketId: socket.id,
          });
        }

        if (userType === "captain") {
          await captainModel.findByIdAndUpdate(userId, {
            socketId: socket.id,
          });
        }
      } catch (err) {
      }
    });

    socket.on("disconnect", async () => {
      const userResult = await userModel.updateMany(
        { socketId: socket.id },
        { $unset: { socketId: "" } }
      );

      const captainResult = await captainModel.updateMany(
        { socketId: socket.id },
        { $unset: { socketId: "" } }
      );
    });
  });
};

export const sendMessageToSocketId = (socketId, message) => {
  if (!io) {
    return;
  }

  if (!socketId) {
    return;
  }

	const targetSocket = io.sockets.sockets.get(socketId);
	if (!targetSocket) {
		return;
	}

  targetSocket.emit(message.event, message.data);
};
