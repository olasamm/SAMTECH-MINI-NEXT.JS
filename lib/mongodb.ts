import mongoose, { type ConnectOptions } from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable");
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseConn: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  } | undefined;
}

let cached = global.mongooseConn;

if (!cached) {
  cached = global.mongooseConn = { conn: null, promise: null };
}

export async function connectToDatabase() {
  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI environment variable is not defined");
  }
  
  const conn = cached;
  if (!conn) throw new Error("Cache not initialized");
  
  if (conn.conn) {
    return conn.conn;
  }
  if (!conn.promise) {
    conn.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false
    } as ConnectOptions);
  }
  conn.conn = await conn.promise;
  return conn.conn;
}


