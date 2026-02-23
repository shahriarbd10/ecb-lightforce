import mongoose, { InferSchemaType, Model, Schema } from "mongoose";

export type UserRole = "player" | "org" | "admin";

const UserSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ["player", "org", "admin"],
      required: true,
      default: "player"
    }
  },
  { timestamps: true }
);

export type UserDocument = InferSchemaType<typeof UserSchema>;

const User: Model<UserDocument> = mongoose.models.User || mongoose.model("User", UserSchema);

export default User;
