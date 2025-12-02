import mongoose from 'mongoose';
import dotenv from "dotenv"
dotenv.config();

const connectToDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(process.env.MONGODB_URL);
        console.log(`\n MongoDB connected !! DB HOST: ${connectionInstance.connection.host}`);
    } catch (error) {
        console.log("MONGODB connection FAILED ", error);
        
    }
}

export default connectToDB;