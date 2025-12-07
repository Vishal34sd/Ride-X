import express from "express"
import dotenv from "dotenv";
import http from "http";
import app from "./app.js";
dotenv.config();
import {initializeSocket} from "./socket.js"

const PORT = process.env.PORT || 8080;

const server = http.createServer(app);
initializeSocket(server);

server.listen( PORT , ()=>{
    console.log(`Server is running on ${process.env.PORT}`)
})