import mongoose, { InferSchemaType, Model, Schema, Types } from "mongoose";

const PasswordResetTokenSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: "User", required: true, index: true },
    tokenHash: { type: String, required: true, unique: true, index: true },
    expiresAt: { type: Date, required: true, index: true },
    usedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

export type PasswordResetTokenDocument = InferSchemaType<typeof PasswordResetTokenSchema>;

const PasswordResetToken: Model<PasswordResetTokenDocument> =
  mongoose.models.PasswordResetToken || mongoose.model("PasswordResetToken", PasswordResetTokenSchema);

export default PasswordResetToken;
