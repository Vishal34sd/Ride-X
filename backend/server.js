import dotenv from "dotenv";
import http from "http";
import app from "./app.js";
import { initializeSocket } from "./socket.js";

import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, ".env") });

const PORT = process.env.PORT || 8080;

const server = http.createServer(app);

// Initialize Socket.IO for real-time communication
initializeSocket(server);

server.listen(PORT, () => {
    console.log(`[Server] Ride-X running on port ${PORT} | Socket.IO ready`);
});
