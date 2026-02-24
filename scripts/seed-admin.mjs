import dns from "node:dns";
import crypto from "node:crypto";
import mongoose from "mongoose";
import { hash } from "bcryptjs";

function readArg(name, fallback = "") {
  const key = `--${name}=`;
  const hit = process.argv.find((a) => a.startsWith(key));
  return hit ? hit.slice(key.length) : fallback;
}

function getEnv(name, fallback = "") {
  return process.env[name] || fallback;
}

function parseBool(value, fallback = false) {
  if (!value) return fallback;
  return ["1", "true", "yes", "y"].includes(String(value).toLowerCase());
}

function toSlug(input) {
  return String(input || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

async function connect(uri) {
  try {
    await mongoose.connect(uri, { dbName: "ecb_lightforce", serverSelectionTimeoutMS: 10000 });
    return;
  } catch (error) {
    const message = String(error?.message || "");
    const isSrvIssue = message.includes("querySrv") || message.includes("ECONNREFUSED");
    if (uri.startsWith("mongodb+srv://") && isSrvIssue) {
      dns.setServers(["8.8.8.8", "1.1.1.1"]);
      await mongoose.connect(uri, { dbName: "ecb_lightforce", serverSelectionTimeoutMS: 12000 });
      return;
    }
    throw error;
  }
}

async function main() {
  const uri = getEnv("MONGODB_URI");
  if (!uri) throw new Error("MONGODB_URI is missing.");

  const email = readArg("email", getEnv("SEED_ADMIN_EMAIL", "admin@ecblightforce.com")).toLowerCase();
  const password = readArg("password", getEnv("SEED_ADMIN_PASSWORD", "Admin@123456"));
  const name = readArg("name", getEnv("SEED_ADMIN_NAME", "ECB Admin"));
  const force = parseBool(readArg("force", getEnv("SEED_FORCE", "")), false);

  await connect(uri);
  const users = mongoose.connection.db.collection("users");
  const profiles = mongoose.connection.db.collection("playerprofiles");

  const existing = await users.findOne({ email });
  if (existing && !force) {
    console.log(`Admin already exists for ${email}. Use --force=true to rotate password/role.`);
    await mongoose.disconnect();
    return;
  }

  const passwordHash = await hash(password, 10);
  let userId = existing?._id;

  if (existing) {
    await users.updateOne(
      { _id: existing._id },
      { $set: { name, passwordHash, role: "admin", updatedAt: new Date() } }
    );
  } else {
    const inserted = await users.insertOne({
      name,
      email,
      passwordHash,
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date()
    });
    userId = inserted.insertedId;
  }

  const profileExists = await profiles.findOne({ user: userId });
  if (!profileExists) {
    await profiles.insertOne({
      user: userId,
      slug: `${toSlug(name) || "admin"}-${crypto.randomUUID().slice(0, 6)}`,
      headline: "Football & Futsal Player",
      location: "Dhaka, Bangladesh",
      age: 25,
      heightCm: 172,
      weightKg: 68,
      foot: "right",
      positions: ["CM"],
      bio: "",
      stats: { matches: 0, goals: 0, assists: 0, cleanSheets: 0 },
      availableNow: false,
      offDays: [],
      availableTime: "",
      profilePhoto: "",
      photos: [],
      achievements: [],
      timeline: [],
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  await mongoose.disconnect();
  console.log("Admin seeded successfully.");
  console.log(`Login email: ${email}`);
  console.log("Login page: /login");
  console.log("Admin media page: /admin/media");
}

main().catch(async (error) => {
  console.error("Seed admin failed:", error?.message || error);
  try {
    await mongoose.disconnect();
  } catch {}
  process.exit(1);
});
