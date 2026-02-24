import mongoose, { InferSchemaType, Model, Schema } from "mongoose";

const AchievementSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    details: { type: String, default: "", trim: true },
    date: { type: Date },
    image: { type: String, default: "" }
  },
  { _id: false }
);

const TimelineSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    club: { type: String, default: "", trim: true },
    startDate: { type: Date },
    endDate: { type: Date },
    description: { type: String, default: "", trim: true }
  },
  { _id: false }
);

const PlayerProfileSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    slug: { type: String, required: true, unique: true, index: true },
    headline: { type: String, default: "Football & Futsal Player", trim: true },
    location: { type: String, default: "", trim: true },
    age: { type: Number, min: 8, max: 60, required: true },
    heightCm: { type: Number, min: 100, max: 250, required: true },
    weightKg: { type: Number, min: 30, max: 200, required: true },
    foot: { type: String, enum: ["left", "right", "both"], default: "right" },
    positions: [{ type: String, trim: true }],
    bio: { type: String, default: "", trim: true },
    stats: {
      matches: { type: Number, default: 0, min: 0 },
      goals: { type: Number, default: 0, min: 0 },
      assists: { type: Number, default: 0, min: 0 },
      cleanSheets: { type: Number, default: 0, min: 0 }
    },
    availableNow: { type: Boolean, default: false, index: true },
    offDays: [{ type: String, trim: true }],
    availableTime: { type: String, default: "", trim: true },
    profilePhoto: { type: String, default: "" },
    profilePhotoMeta: {
      x: { type: Number, min: 0, max: 100, default: 50 },
      y: { type: Number, min: 0, max: 100, default: 50 },
      zoom: { type: Number, min: 1, max: 2, default: 1 }
    },
    photos: [{ type: String }],
    achievements: [AchievementSchema],
    timeline: [TimelineSchema]
  },
  { timestamps: true }
);

PlayerProfileSchema.index({ age: 1, availableNow: 1 });
PlayerProfileSchema.index({ positions: 1 });

export type PlayerProfileDocument = InferSchemaType<typeof PlayerProfileSchema>;

const PlayerProfile: Model<PlayerProfileDocument> =
  mongoose.models.PlayerProfile || mongoose.model("PlayerProfile", PlayerProfileSchema);

export default PlayerProfile;
