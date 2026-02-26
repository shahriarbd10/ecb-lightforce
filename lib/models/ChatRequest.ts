import mongoose, { InferSchemaType, Model, Schema } from "mongoose";

const ChatRequestSchema = new Schema(
  {
    requester: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    recipient: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
      index: true
    },
    handledAt: { type: Date, default: null }
  },
  { timestamps: true }
);

ChatRequestSchema.index({ requester: 1, recipient: 1 }, { unique: true });

export type ChatRequestDocument = InferSchemaType<typeof ChatRequestSchema>;

const ChatRequest: Model<ChatRequestDocument> =
  mongoose.models.ChatRequest || mongoose.model("ChatRequest", ChatRequestSchema);

export default ChatRequest;

