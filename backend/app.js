import express from "express"
import cors from "cors";
import cookieParser from "cookie-parser"

import userRoutes from "./routes/userRoutes.js"
import captainRoutes from "./routes/captainRoutes.js"
import mapRoutes from "./routes/mapRoutes.js"
import rideRoutes from "./routes/rideRoutes.js"
import connectToDb from "./config/connectToDB.js"



const app = express() ;
connectToDb();


app.use(express.json());
app.use(express.urlencoded({extended : true}));
app.use(cors());
app.use(cookieParser());


app.use("/api/v1/users", userRoutes);
app.use("/api/v1/captains", captainRoutes);
app.use("/api/v1/maps", mapRoutes);
app.use("/api/v1/rides" , rideRoutes)


export default app ;