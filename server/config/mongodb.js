import mongoose from "mongoose";

//Connect to MongoDB 
const connectDB = async () => {

    //Try to connect to MongoDB
    try {
        //Connect to MongoDB
        await mongoose.connect(`${process.env.MONGODB_URI}/mern-auth`);
        
        //Log success
        console.log('Connected to MongoDB');
    } catch (error) {
        //Log error
        console.log(error);
    }

    //If error, log error
    mongoose.connection.on('error', (err) => {
        console.log(`MongoDB connection error: ${err}`);
    })
}

export default connectDB;
