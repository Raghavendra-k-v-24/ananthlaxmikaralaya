import mongoose from "mongoose";

// Admin accounts. There is no sign-up: accounts are created with `npm run create-admin`.
const adminSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, lowercase: true, trim: true, minlength: 3, maxlength: 40 },
    displayName: { type: String, trim: true, maxlength: 60, default: "" },
    passwordHash: { type: String, required: true, select: false }, // bcrypt
    // Bumped when the password changes, which signs out every existing session.
    tokenVersion: { type: Number, default: 0 },
    failedLogins: { type: Number, default: 0 },
    lockedUntil: { type: Date, default: null },
    lastLoginAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const Admin = mongoose.models.Admin ?? mongoose.model("Admin", adminSchema);

export function serializeAdmin(a) {
  return {
    id: String(a._id),
    username: a.username,
    displayName: a.displayName || a.username,
    lastLoginAt: a.lastLoginAt,
  };
}
