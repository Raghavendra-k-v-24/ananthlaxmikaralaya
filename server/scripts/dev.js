// Runs the API locally on http://localhost:4000 (or PORT).
//
//   npm run dev          uses MONGODB_URI from .env (e.g. your Atlas cluster)
//   npm run dev:memory   starts a throw-away in-memory MongoDB instead, so nothing real is touched.
//                        If SEED_ADMIN_USERNAME and SEED_ADMIN_PASSWORD are set in .env,
//                        that admin is created in it so you can sign in to the admin panel.

const useMemory = process.argv.includes("--memory");

if (useMemory) {
  const { MongoMemoryServer } = await import("mongodb-memory-server");
  const mongo = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongo.getUri("ananth-laxmi");
  console.log("[dev] using an in-memory MongoDB (data is lost when this stops)");
  const stop = async () => {
    await mongo.stop();
    process.exit(0);
  };
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);
}

process.env.ALLOWED_ORIGINS ||= "http://localhost:5179,http://localhost:5180";

const { default: app } = await import("../src/app.js");
const { connectDb } = await import("../src/db.js");

await connectDb();

if (useMemory && process.env.SEED_ADMIN_USERNAME && process.env.SEED_ADMIN_PASSWORD) {
  const { Admin } = await import("../src/models/Admin.js");
  const { hashPassword } = await import("../src/lib/auth.js");
  await Admin.create({
    username: process.env.SEED_ADMIN_USERNAME,
    displayName: process.env.SEED_ADMIN_NAME ?? "",
    passwordHash: await hashPassword(process.env.SEED_ADMIN_PASSWORD),
  });
  console.log(`[dev] created admin "${process.env.SEED_ADMIN_USERNAME}" from SEED_ADMIN_* in .env`);
}

const port = Number(process.env.PORT) || 4000;

// Windows can let two servers share a port silently, so check first and say so clearly.
const inUse = await fetch(`http://127.0.0.1:${port}/api/health`, { signal: AbortSignal.timeout(500) })
  .then(() => true)
  .catch(() => false);
if (inUse) {
  console.error(`[dev] port ${port} is already in use: another copy of the API is probably running. Stop it first.`);
  process.exit(1);
}

app.listen(port, () => {
  console.log(`[dev] API ready on http://localhost:${port}`);
  console.log(`[dev] browsers allowed from: ${process.env.ALLOWED_ORIGINS}`);
});
