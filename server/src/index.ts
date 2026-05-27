import express from "express";
import cors from "cors";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./auth";
import { requireAuth } from "./middleware/requireAuth";
import { errorHandler } from "./middleware/errorHandler";
import usersRouter from "./routes/users";

const app = express();
const PORT = process.env.PORT ?? 3000;

app.use(helmet());

const allowedOrigins = process.env.TRUSTED_ORIGINS!.split(",");
app.use(cors({ origin: allowedOrigins, credentials: true }));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: "draft-8",
  legacyHeaders: false,
});

const isProduction = process.env.NODE_ENV === "production";

app.all("/api/auth/*path", ...(isProduction ? [authLimiter] : []), toNodeHandler(auth));

app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/me", requireAuth, (req, res) => {
  const { id, name, email, role } = req.user!;
  res.json({ user: { id, name, email, role } });
});

app.use("/api/users", usersRouter);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
