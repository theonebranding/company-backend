import mongoose from "mongoose";

mongoose.set("strictQuery", false);

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL,{
      serverSelectionTimeoutMS: 30000, 
      socketTimeoutMS: 45000, 
    });
    console.log("MongoDB database is successfully connected");
  } catch (err) {
    console.error("Connection failed! MongoDB database is not connected");
    console.error(err);
  }
};

export default connectDB;