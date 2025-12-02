import express from "express"
import dotenv from "dotenv";
import http from "http";
import app from "./app.js";
dotenv.config();

const PORT = process.env.PORT || 8080;

const server = http.createServer(app);

server.listen( PORT , ()=>{
    console.log(`Server is running on ${process.env.PORT}`)
})