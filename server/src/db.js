import mongoose from "mongoose";
import { config } from "./config.js";

// On Vercel each request may land on a warm function that already has a connection.
// Keep one shared connection promise so warm invocations reuse it instead of reconnecting.
const cached = (globalThis.__alkMongo ??= { promise: null });

export function connectDb() {
  if (mongoose.connection.readyState === 1) return Promise.resolve(mongoose);
  cached.promise ??= mongoose
    .connect(config.mongoUri, { serverSelectionTimeoutMS: 8000, maxPoolSize: 5 })
    .catch((err) => {
      cached.promise = null; // let the next request retry
      throw err;
    });
  return cached.promise;
}

export async function disconnectDb() {
  cached.promise = null;
  await mongoose.disconnect();
}
