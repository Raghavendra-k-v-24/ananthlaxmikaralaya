// Creates an admin account, or resets its password. There is no sign-up page; this is the only way in.
//
//   npm run create-admin -- <username> ["Display Name"]
//   npm run create-admin -- <username> --reset        (set a new password for an existing admin)
//
// It connects to MONGODB_URI from .env and asks for the password without showing it.

import readline from "node:readline";
import { connectDb, disconnectDb } from "../src/db.js";
import { Admin } from "../src/models/Admin.js";
import { hashPassword } from "../src/lib/auth.js";
import { changePasswordInput } from "../src/lib/validation.js";

const args = process.argv.slice(2);
const reset = args.includes("--reset");
const [username, displayName = ""] = args.filter((a) => a !== "--reset");

if (!username || !/^[a-z0-9._-]{3,40}$/i.test(username)) {
  console.error('Usage: npm run create-admin -- <username> ["Display Name"] [--reset]');
  console.error("Usernames are 3-40 letters, numbers, dots, dashes or underscores.");
  process.exit(1);
}

function askHidden(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    rl._writeToOutput = (s) => {
      // show the prompt, hide what is typed
      if (s.includes(question)) rl.output.write(s);
    };
    rl.question(question, (answer) => {
      rl.close();
      process.stdout.write("\n");
      resolve(answer);
    });
  });
}

// For scripted use (CI etc.) the password can come from ADMIN_PASSWORD instead of the prompt.
let password = process.env.ADMIN_PASSWORD;
if (!password) {
  password = await askHidden("Password: ");
  const again = await askHidden("Repeat password: ");
  if (password !== again) {
    console.error("The passwords do not match.");
    process.exit(1);
  }
}

const strength = changePasswordInput.shape.newPassword.safeParse(password);
if (!strength.success) {
  console.error(`Password too weak: ${strength.error.issues[0].message}.`);
  process.exit(1);
}

await connectDb();
try {
  const existing = await Admin.findOne({ username: username.toLowerCase() });
  if (existing && !reset) {
    console.error(`An admin called "${existing.username}" already exists. Add --reset to set a new password.`);
    process.exitCode = 1;
  } else if (existing) {
    existing.passwordHash = await hashPassword(password);
    existing.tokenVersion += 1; // signs out their open sessions
    existing.failedLogins = 0;
    existing.lockedUntil = null;
    if (displayName) existing.displayName = displayName;
    await existing.save();
    console.log(`Password reset for "${existing.username}". Their other sessions were signed out.`);
  } else {
    await Admin.create({ username, displayName, passwordHash: await hashPassword(password) });
    console.log(`Admin "${username.toLowerCase()}" created. Sign in at the admin panel.`);
  }
} finally {
  await disconnectDb();
}
