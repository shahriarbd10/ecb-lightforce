import mongoose, { InferSchemaType, Model, Schema } from "mongoose";

const ChatConversationSchema = new Schema(
  {
    memberKey: { type: String, required: true, unique: true, index: true },
    members: [{ type: Schema.Types.ObjectId, ref: "User", required: true, index: true }],
    lastMessageAt: { type: Date, default: null, index: true }
  },
  { timestamps: true }
);

export type ChatConversationDocument = InferSchemaType<typeof ChatConversationSchema>;

const ChatConversation: Model<ChatConversationDocument> =
  mongoose.models.ChatConversation || mongoose.model("ChatConversation", ChatConversationSchema);

export default ChatConversation;

