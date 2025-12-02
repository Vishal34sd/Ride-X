import express from "express"
import cors from "cors";
import cookieParser from "cookie-parser"
import userRoutes from "./routes/userRoutes.js"
import connectToDb from "./config/connectToDB.js"



const app = express() ;
connectToDb();


app.use(express.json());
app.use(express.urlencoded({extended : true}));
app.use(cors());
app.use(cookieParser());


app.use("/api/v1/users", userRoutes);


export default app ;