import "./instrument";
import { Sentry } from "./lib/sentry";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import path from "path";
import { rateLimit } from "express-rate-limit";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./auth";
import { requireAuth } from "./middleware/requireAuth";
import { errorHandler } from "./middleware/errorHandler";
import usersRouter from "./routes/users";
import ticketsRouter from "./routes/tickets";
import dashboardRouter from "./routes/dashboard";
import { startQueue, stopQueue } from "./queue";

const app = express();
const PORT = process.env.PORT ?? 3000;

const isProduction = process.env.NODE_ENV === "production";

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "blob:"],
        fontSrc: ["'self'"],
        connectSrc: ["'self'", "https://*.ingest.sentry.io", "https://*.sentry.io"],
        workerSrc: ["blob:"],
      },
    },
  })
);

const allowedOrigins = process.env.TRUSTED_ORIGINS!.split(",");
app.use(cors({ origin: allowedOrigins, credentials: true }));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: "draft-8",
  legacyHeaders: false,
});

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
app.use("/api/tickets", ticketsRouter);
app.use("/api/dashboard", dashboardRouter);

if (isProduction) {
  const clientDist = path.resolve(process.cwd(), "client/dist");
  app.use(express.static(clientDist));
  app.use((req, res, next) => {
    if (req.path.startsWith("/api")) return next();
    res.sendFile(path.join(clientDist, "index.html"));
  });
}

Sentry.setupExpressErrorHandler(app);
app.use(errorHandler);

async function boot() {
  await startQueue();
  app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
  });
  process.on("SIGTERM", stopQueue);
  process.on("SIGINT", stopQueue);
}

boot();
