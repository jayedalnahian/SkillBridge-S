import { prisma } from "../lib/prisma.js";




async function connectDB() {
  try {
    await prisma.$connect();
    console.log("✅ Database connected successfully");
  } catch (error) {
    console.error("❌ Database connection failed:", error);
  }
}

export default connectDB;