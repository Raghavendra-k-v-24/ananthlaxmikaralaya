import express from "express";
import cors from "cors";
import helmet from "helmet";
import { config } from "./config.js";
import { connectDb } from "./db.js";
import { errorHandler, notFound } from "./lib/http.js";
import { enquiriesRouter } from "./routes/enquiries.js";
import { authRouter } from "./routes/auth.js";
import { adminRouter } from "./routes/admin.js";

const app = express();
app.disable("x-powered-by");
app.set("trust proxy", true);

app.use(helmet());
app.use(
  cors({
    // Only the public site and the admin panel may call the API from a browser.
    origin(origin, callback) {
      callback(null, !origin || config.allowedOrigins.includes(origin));
    },
    methods: ["GET", "POST", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["Content-Disposition"],
    maxAge: 600,
  })
);
app.use(express.json({ limit: "20kb" }));

app.get("/api/health", (_req, res) => res.json({ ok: true }));

// Everything below needs the database
app.use("/api", async (_req, _res, next) => {
  await connectDb();
  next();
});

app.use("/api/enquiries", enquiriesRouter);
app.use("/api/auth", authRouter);
app.use("/api/admin", adminRouter);

app.use(notFound);
app.use(errorHandler);

export default app;
