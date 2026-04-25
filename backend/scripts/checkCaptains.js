import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
import captainModel from '../models/captainModel.js';

const run = async () => {
    await mongoose.connect(process.env.MONGODB_URL);
    
    // Find captains who have a real location (not [0,0])
    const captains = await captainModel.find({}).select(
        'fullname email socketId vehicles.vehicleType currentLocation.coordinates status isAvailable'
    );
    
    captains.forEach(c => {
        const coords = c.currentLocation?.coordinates || [0,0];
        const hasLocation = coords[0] !== 0 || coords[1] !== 0;
        console.log(`${c.fullname.firstname} ${c.fullname.lastname} (${c._id})`);
        console.log(`  vehicle: ${c.vehicles.vehicleType} | status: ${c.status} | available: ${c.isAvailable}`);
        console.log(`  socketId: ${c.socketId || 'NONE'}`);
        console.log(`  location: [${coords}] ${hasLocation ? '✅' : '❌ NO LOCATION'}`);
        console.log('');
    });
    
    await mongoose.disconnect();
};
run();
