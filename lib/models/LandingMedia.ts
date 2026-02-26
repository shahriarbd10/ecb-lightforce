import mongoose, { InferSchemaType, Model, Schema } from "mongoose";

const LandingMediaSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    type: { type: String, enum: ["image", "video"], required: true },
    mediaUrl: { type: String, required: true, trim: true },
    thumbnailUrl: { type: String, default: "", trim: true },
    linkUrl: { type: String, default: "", trim: true },
    placement: { type: String, enum: ["hero", "ads", "spotlight", "reels"], default: "ads" },
    order: { type: Number, default: 0 },
    colSpan: { type: Number, min: 1, max: 3, default: 1 },
    cardHeight: { type: Number, min: 160, max: 520, default: 220 },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

LandingMediaSchema.index({ isActive: 1, placement: 1, order: 1, updatedAt: -1 });

export type LandingMediaDocument = InferSchemaType<typeof LandingMediaSchema>;

const LandingMedia: Model<LandingMediaDocument> =
  mongoose.models.LandingMedia || mongoose.model("LandingMedia", LandingMediaSchema);

export default LandingMedia;
