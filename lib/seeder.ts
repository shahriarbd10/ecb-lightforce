import dns from "node:dns";
import crypto from "node:crypto";
import mongoose from "mongoose";
import { hash } from "bcryptjs";

function toSlug(input: string) {
  return String(input || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export async function connectForSeed(uri: string) {
  try {
    await mongoose.connect(uri, { dbName: "ecb_lightforce", serverSelectionTimeoutMS: 10000 });
    return;
  } catch (error: any) {
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

export async function seedAdmin(params: { email: string; password: string; name: string; force?: boolean }) {
  const db = mongoose.connection.db;
  if (!db) throw new Error("Database connection is not initialized.");
  const users = db.collection("users");
  const profiles = db.collection("playerprofiles");

  const email = params.email.toLowerCase();
  const existing = await users.findOne({ email });
  if (existing && !params.force) {
    return { created: false, message: "Admin already exists. Use force to rotate password/role." };
  }

  const passwordHash = await hash(params.password, 10);
  let userId: any = existing?._id;

  if (existing) {
    await users.updateOne(
      { _id: existing._id },
      { $set: { name: params.name, passwordHash, role: "admin", updatedAt: new Date() } }
    );
  } else {
    const inserted = await users.insertOne({
      name: params.name,
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
      slug: `${toSlug(params.name) || "admin"}-${crypto.randomUUID().slice(0, 6)}`,
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

  return { created: true, message: "Admin seeded successfully." };
}

export async function seedUser(params: {
  email: string;
  password: string;
  name: string;
  location: string;
  age: number;
  heightCm: number;
  weightKg: number;
  foot: "left" | "right" | "both";
  positions: string[];
}) {
  const db = mongoose.connection.db;
  if (!db) throw new Error("Database connection is not initialized.");
  const users = db.collection("users");
  const profiles = db.collection("playerprofiles");

  const email = params.email.toLowerCase();
  const existing = await users.findOne({ email });
  if (existing) {
    return { created: false, message: "User already exists for this email." };
  }

  const passwordHash = await hash(params.password, 10);
  const insertedUser = await users.insertOne({
    name: params.name,
    email,
    passwordHash,
    role: "player",
    createdAt: new Date(),
    updatedAt: new Date()
  });

  await profiles.insertOne({
    user: insertedUser.insertedId,
    slug: `${toSlug(params.name) || "player"}-${crypto.randomUUID().slice(0, 6)}`,
    headline: "Football & Futsal Player",
    location: params.location,
    age: params.age,
    heightCm: params.heightCm,
    weightKg: params.weightKg,
    foot: params.foot,
    positions: params.positions,
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

  return { created: true, message: "User seeded successfully." };
}
