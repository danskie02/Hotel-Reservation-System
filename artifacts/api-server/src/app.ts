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
app.use(cors({ credentials: true }));
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
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 1000 * 60 * 60 * 24 * 30,
    },
  }),
);

app.use("/api", router);

export default app;
