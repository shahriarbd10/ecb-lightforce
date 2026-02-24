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

function parseNumber(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function parseCsv(value, fallback = []) {
  if (!value) return fallback;
  return String(value)
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
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

  const email = readArg("email", getEnv("SEED_USER_EMAIL", `player-${Date.now()}@ecb.local`)).toLowerCase();
  const password = readArg("password", getEnv("SEED_USER_PASSWORD", "Player@123456"));
  const name = readArg("name", getEnv("SEED_USER_NAME", "Demo Player"));
  const location = readArg("location", getEnv("SEED_USER_LOCATION", "Dhaka, Bangladesh"));
  const age = parseNumber(readArg("age", getEnv("SEED_USER_AGE", "22")), 22);
  const heightCm = parseNumber(readArg("heightCm", getEnv("SEED_USER_HEIGHT_CM", "170")), 170);
  const weightKg = parseNumber(readArg("weightKg", getEnv("SEED_USER_WEIGHT_KG", "65")), 65);
  const foot = readArg("foot", getEnv("SEED_USER_FOOT", "right"));
  const positions = parseCsv(readArg("positions", getEnv("SEED_USER_POSITIONS", "CM")), ["CM"]);

  await connect(uri);
  const users = mongoose.connection.db.collection("users");
  const profiles = mongoose.connection.db.collection("playerprofiles");

  const existing = await users.findOne({ email });
  if (existing) {
    throw new Error(`User already exists for ${email}. Use a different email.`);
  }

  const passwordHash = await hash(password, 10);
  const insertedUser = await users.insertOne({
    name,
    email,
    passwordHash,
    role: "player",
    createdAt: new Date(),
    updatedAt: new Date()
  });

  await profiles.insertOne({
    user: insertedUser.insertedId,
    slug: `${toSlug(name) || "player"}-${crypto.randomUUID().slice(0, 6)}`,
    headline: "Football & Futsal Player",
    location,
    age,
    heightCm,
    weightKg,
    foot: ["left", "right", "both"].includes(foot) ? foot : "right",
    positions,
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

  await mongoose.disconnect();
  console.log("Player seeded successfully.");
  console.log(`Login email: ${email}`);
  console.log("Login page: /login");
  console.log("Hub page: /ecb-hub");
}

main().catch(async (error) => {
  console.error("Seed user failed:", error?.message || error);
  try {
    await mongoose.disconnect();
  } catch {}
  process.exit(1);
});
