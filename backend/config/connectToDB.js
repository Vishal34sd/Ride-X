import mongoose from 'mongoose';
import dotenv from "dotenv"
dotenv.config();

const connectToDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URL);
        console.log("Database connected successfully")
    } catch (error) {
        console.log("Dagtabase not connected", error)
    }
}

export default connectToDB;