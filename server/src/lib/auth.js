import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { config } from "../config.js";

const BCRYPT_COST = 12;

export const hashPassword = (password) => bcrypt.hash(password, BCRYPT_COST);
export const checkPassword = (password, hash) => bcrypt.compare(password, hash);

// Compared against when a username does not exist, so a wrong username takes as long
// to reject as a wrong password and does not reveal which usernames exist.
let dummyHash;
export async function burnPasswordCheck(password) {
  dummyHash ??= await bcrypt.hash("not-a-real-password", BCRYPT_COST);
  await bcrypt.compare(password, dummyHash);
}

export function signToken(admin) {
  return jwt.sign({ tv: admin.tokenVersion }, config.jwtSecret, {
    subject: String(admin._id),
    expiresIn: config.tokenTtl,
    algorithm: "HS256",
  });
}

export function verifyToken(token) {
  return jwt.verify(token, config.jwtSecret, { algorithms: ["HS256"] });
}
