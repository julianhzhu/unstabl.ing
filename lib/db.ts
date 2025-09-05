import mongoose from "mongoose";

const MAX_RETRIES = 4;
const INITIAL_RETRY_DELAY_MS = 1000;

// Utility function to handle retries
export const runWithRetry = async <T>(
  operation: () => Promise<T>,
  retries = MAX_RETRIES,
  delay = INITIAL_RETRY_DELAY_MS
): Promise<T> => {
  try {
    return await operation();
  } catch (error) {
    if (retries > 0) {
      console.warn(`Operation failed. Retrying... Attempts left: ${retries}`);
      await new Promise((res) => setTimeout(res, delay)); // Wait before retrying
      return runWithRetry(operation, retries - 1, delay); // Exponential backoff
    } else {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(
        `Operation failed after ${MAX_RETRIES} retries: ${errorMessage}`
      );
    }
  }
};

export const runConnectDB = async () => {
  if (!!mongoose.connections.find((c) => !!c.readyState)) {
    // Use current db connection
    console.log(
      `Connected to ${process.env.NODE_ENV} server reusing old connection...`
    );
  } else {
    try {
      const MONGODB_URI =
        process.env.MONGODB_URI || "mongodb://localhost:27017/usduc-ideas";
      await mongoose.connect(MONGODB_URI, {
        minPoolSize: 11,
        w: "majority",
        socketTimeoutMS: 30000,
      });
      console.log(
        `Connected to ${process.env.NODE_ENV} server and successfully to mongodb...`
      );
    } catch (error) {
      console.log(error);
    }
  }
  return mongoose;
};

export default runConnectDB;

