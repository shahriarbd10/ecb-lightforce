import mongoose, { InferSchemaType, Model, Schema } from "mongoose";

const HubPostSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: { type: String, enum: ["achievement", "match_update", "general"], required: true, default: "general" },
    title: { type: String, required: true, trim: true, minlength: 2, maxlength: 140 },
    content: { type: String, required: true, trim: true, minlength: 2, maxlength: 1200 },
    image: { type: String, default: "", trim: true },
    isActive: { type: Boolean, default: true, index: true }
  },
  { timestamps: true }
);

HubPostSchema.index({ isActive: 1, createdAt: -1 });

export type HubPostDocument = InferSchemaType<typeof HubPostSchema>;

const HubPost: Model<HubPostDocument> = mongoose.models.HubPost || mongoose.model("HubPost", HubPostSchema);

export default HubPost;
