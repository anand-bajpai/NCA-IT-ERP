import mongoose from "mongoose";

let isConnected = false;

export async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.warn(
      "⚠️  MONGODB_URI not set in .env — the Admin Panel (login, students) will NOT work until this is set. Public forms (contact/internship/enrollment) will still email fine."
    );
    return;
  }

  try {
    mongoose.set("strictQuery", true);

    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 8000, // fail fast instead of hanging
    });

    isConnected = true;
    console.log("MongoDB connected");
  } catch (err) {
    isConnected = false;
    console.error("❌ MongoDB connection failed:", err.message);
    console.warn(
      "⚠️  Continuing without database — Admin Panel will not work until MongoDB is reachable."
    );
  }

  mongoose.connection.on("disconnected", () => {
    isConnected = false;
    console.warn("MongoDB disconnected");
  });

  mongoose.connection.on("reconnected", () => {
    isConnected = true;
    console.log("MongoDB reconnected");
  });
}

export function isDbConnected() {
  return isConnected && mongoose.connection.readyState === 1;
}
