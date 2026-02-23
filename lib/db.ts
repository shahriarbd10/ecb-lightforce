import mongoose from "mongoose";
import dns from "node:dns";

const MONGODB_URI = process.env.MONGODB_URI;

type Cached = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

declare global {
  var mongooseCache: Cached | undefined;
}

const cached = global.mongooseCache || { conn: null, promise: null };

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

export async function connectToDatabase() {
  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is missing. Set it in your environment variables.");
  }

  const uri = MONGODB_URI;
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    const connect = () =>
      mongoose.connect(uri, {
        dbName: "ecb_lightforce",
        serverSelectionTimeoutMS: 10000
      });

    cached.promise = Promise
      .resolve()
      .then(connect)
      .catch(async (error) => {
        const message = String(error?.message || "");
        const isSrvLookupError = message.includes("querySrv") || message.includes("ECONNREFUSED");

        if (uri.startsWith("mongodb+srv://") && isSrvLookupError) {
          const override =
            process.env.MONGODB_DNS_SERVERS?.split(",").map((s) => s.trim()).filter(Boolean) || ["8.8.8.8", "1.1.1.1"];
          dns.setServers(override);

          try {
            return await connect();
          } catch {
            throw new Error(
              "MongoDB SRV lookup failed in Node DNS. Set MONGODB_DNS_SERVERS=8.8.8.8,1.1.1.1 or use Atlas non-SRV URI (mongodb://...)."
            );
          }
        }

        throw error;
      })
      .catch((error) => {
        cached.promise = null;
        throw error;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
