import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import mongoose from "mongoose";

export async function GET() {
  const start = Date.now();
  let dbStatus = "disconnected";

  try {
    await connectDB();
    dbStatus = mongoose.connection.readyState === 1 ? "connected" : "disconnected";
  } catch { dbStatus = "error"; }

  return NextResponse.json({
    status: dbStatus === "connected" ? "healthy" : "degraded",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || "1.2.0",
    services: {
      database: dbStatus,
      responseTime: Date.now() - start + "ms",
    },
    memory: {
      rss: Math.round(process.memoryUsage().rss / 1024 / 1024) + "MB",
      heap: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + "MB",
    },
  });
}
