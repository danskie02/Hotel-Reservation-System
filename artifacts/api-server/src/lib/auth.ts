import type { Request, Response, NextFunction } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

declare module "express-session" {
  interface SessionData {
    userId?: number;
  }
}

export async function getCurrentUser(req: Request) {
  const userId = req.session?.userId;
  if (!userId) return null;
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);
  return user ?? null;
}

export function requireUser(allowAdmin = false) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const user = await getCurrentUser(req);
    if (!user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    if (allowAdmin && user.role !== "admin") {
      res.status(403).json({ error: "Admin access required" });
      return;
    }
    (req as Request & { user: typeof user }).user = user;
    next();
  };
}

export function serializeUser(u: {
  id: number;
  fullName: string;
  email: string;
  contactNumber: string;
  role: string;
  createdAt: Date | string;
}) {
  return {
    id: u.id,
    fullName: u.fullName,
    email: u.email,
    contactNumber: u.contactNumber,
    role: u.role,
    createdAt: typeof u.createdAt === "string" ? u.createdAt : u.createdAt.toISOString(),
  };
}
