import { Router } from "express";
import { config } from "../config.js";
import { Admin, serializeAdmin } from "../models/Admin.js";
import { burnPasswordCheck, checkPassword, hashPassword, signToken } from "../lib/auth.js";
import { changePasswordInput, loginInput } from "../lib/validation.js";
import { HttpError } from "../lib/http.js";
import { requireAdmin } from "../middleware/requireAdmin.js";

export const authRouter = Router();

const WRONG = "Incorrect username or password";

authRouter.post("/login", async (req, res) => {
  const parsed = loginInput.safeParse(req.body ?? {});
  if (!parsed.success) throw new HttpError(400, "Enter your username and password");
  const { username, password } = parsed.data;

  const admin = await Admin.findOne({ username }).select("+passwordHash");
  if (!admin) {
    await burnPasswordCheck(password);
    throw new HttpError(401, WRONG);
  }

  if (admin.lockedUntil && admin.lockedUntil > new Date()) {
    const minutes = Math.ceil((admin.lockedUntil - Date.now()) / 60_000);
    throw new HttpError(429, `Too many wrong attempts. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`);
  }

  if (!(await checkPassword(password, admin.passwordHash))) {
    admin.failedLogins += 1;
    if (admin.failedLogins >= config.maxFailedLogins) {
      admin.failedLogins = 0;
      admin.lockedUntil = new Date(Date.now() + config.lockMinutes * 60_000);
    }
    await admin.save();
    throw new HttpError(401, WRONG);
  }

  admin.failedLogins = 0;
  admin.lockedUntil = null;
  admin.lastLoginAt = new Date();
  await admin.save();

  res.json({ token: signToken(admin), admin: serializeAdmin(admin) });
});

authRouter.get("/me", requireAdmin, (req, res) => {
  res.json({ admin: serializeAdmin(req.admin) });
});

// Changing the password signs out every other session; this one gets a fresh token.
authRouter.post("/change-password", requireAdmin, async (req, res) => {
  const { currentPassword, newPassword } = changePasswordInput.parse(req.body ?? {});
  const admin = await Admin.findById(req.admin._id).select("+passwordHash");
  if (!(await checkPassword(currentPassword, admin.passwordHash))) {
    throw new HttpError(400, "Your current password is not correct", {
      fields: { currentPassword: "Your current password is not correct" },
    });
  }
  if (currentPassword === newPassword) {
    throw new HttpError(400, "Choose a password different from the current one", {
      fields: { newPassword: "Choose a password different from the current one" },
    });
  }
  admin.passwordHash = await hashPassword(newPassword);
  admin.tokenVersion += 1;
  await admin.save();
  res.json({ token: signToken(admin), admin: serializeAdmin(admin) });
});
