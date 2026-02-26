import mongoose, { InferSchemaType, Model, Schema } from "mongoose";

const ChatMessageSchema = new Schema(
  {
    conversation: { type: Schema.Types.ObjectId, ref: "ChatConversation", required: true, index: true },
    sender: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    text: { type: String, default: "", trim: true, maxlength: 1200 },
    linkUrl: { type: String, default: "", trim: true, maxlength: 600 },
    imageUrl: { type: String, default: "", trim: true, maxlength: 1200 },
    seenBy: [{ type: Schema.Types.ObjectId, ref: "User" }]
  },
  { timestamps: true }
);

ChatMessageSchema.index({ conversation: 1, createdAt: 1 });

export type ChatMessageDocument = InferSchemaType<typeof ChatMessageSchema>;

const ChatMessage: Model<ChatMessageDocument> =
  mongoose.models.ChatMessage || mongoose.model("ChatMessage", ChatMessageSchema);

export default ChatMessage;

