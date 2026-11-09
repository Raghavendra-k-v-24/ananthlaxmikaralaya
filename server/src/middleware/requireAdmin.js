import { Admin } from "../models/Admin.js";
import { verifyToken } from "../lib/auth.js";
import { HttpError } from "../lib/http.js";

// Lets the request through only with a valid, current admin token ("Authorization: Bearer ...").
export async function requireAdmin(req, _res, next) {
  const header = req.headers.authorization ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) throw new HttpError(401, "Please sign in");

  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    throw new HttpError(401, "Your session has expired. Please sign in again.");
  }

  const admin = await Admin.findById(payload.sub);
  // tokenVersion changes with the password, which ends every older session
  if (!admin || admin.tokenVersion !== payload.tv) {
    throw new HttpError(401, "Your session has expired. Please sign in again.");
  }
  req.admin = admin;
  next();
}
