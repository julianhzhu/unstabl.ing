import type { NextApiRequest, NextApiResponse } from "next";
import { runConnectDB } from "@/lib/db";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Check database connection
    await runConnectDB();

    // Basic health check response
    const health = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version || "1.0.0",
    };

    res.status(200).json(health);
  } catch (error) {
    res.status(500).json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      error: "Database connection failed",
    });
  }
}
