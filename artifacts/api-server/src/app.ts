import express, { type Express } from "express";
import cors from "cors";
import session from "express-session";
import pgSession from "connect-pg-simple";
import pinoHttp from "pino-http";
import path from "path";
import router from "./routes";
import { logger } from "./lib/logger";
import { pool } from "@workspace/db";

const app: Express = express();
const isProduction = process.env.NODE_ENV === "production";

function parseAllowedOrigins(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

const allowedOrigins = new Set<string>([
  ...parseAllowedOrigins(process.env.CORS_ALLOWED_ORIGINS),
  ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL.trim()] : []),
  ...(!isProduction ? ["http://localhost:5173", "http://127.0.0.1:5173"] : []),
]);

// Initialize session table if it doesn't exist
async function initializeSessionTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS session (
        sid varchar NOT NULL COLLATE "default",
        sess json NOT NULL,
        expire timestamp(6) NOT NULL,
        PRIMARY KEY (sid)
      );
      CREATE INDEX IF NOT EXISTS IDX_session_expire ON session (expire);
    `);
    logger.info("Session table initialized successfully");
  } catch (error) {
    logger.error("Failed to initialize session table:", error);
    throw error;
  }
}

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.set("trust proxy", 1);
app.use(
  cors({
    origin(origin, callback) {
      // Allow non-browser requests (no Origin header), e.g. health checks.
      if (!origin) {
        callback(null, true);
        return;
      }

      if (allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`CORS origin not allowed: ${origin}`));
    },
    credentials: true,
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    maxAge: 86400,
  }),
);
app.use("/uploads", express.static(path.resolve(process.cwd(), "uploads")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const sessionSecret =
  process.env.SESSION_SECRET ??
  (process.env.NODE_ENV !== "production" ? "dev-session-secret-change-me" : undefined);
if (!sessionSecret) {
  throw new Error("SESSION_SECRET environment variable is required");
}

const PostgresqlStore = pgSession(session);

app.use(
  session({
    store: new PostgresqlStore({
      pool,
      tableName: "session",
    }),
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      // Render commonly serves frontend and API on different domains.
      // Cross-site session cookies require SameSite=None + Secure.
      sameSite: isProduction ? "none" : "lax",
      secure: isProduction,
      maxAge: 1000 * 60 * 60 * 24 * 30,
    },
  }),
);

app.use("/api", router);

export { initializeSessionTable };
export default app;
