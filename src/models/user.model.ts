import mongoose, { Schema } from "mongoose";
import { IUser } from "../types";

const UserSchema: Schema = new Schema(
  {
    firstName: { type: String },
    lastName: { type: String },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true
    },
    password: { type: String, required: true },
    role: {
      type: String,
      required: true,
      enum: ["admin", "manager", "user"],
      default: "user"
    },
    active: {
      type: Boolean,
      default: false
    },
    teams: [
      {
        type: String // Stocker simplement les IDs sous forme de chaînes
      }
    ],
    companyId: {
      type: String // Stocker simplement l'ID sous forme de chaîne
    },
    lastLogin: {
      type: Date
    },
    provider: {
      type: String,
      enum: ["local", "google"],
      default: "local"
    },
    confirmationToken: {
      type: String
    }
  },
  { timestamps: true }
);

export default mongoose.model<IUser & mongoose.Document>("User", UserSchema);
