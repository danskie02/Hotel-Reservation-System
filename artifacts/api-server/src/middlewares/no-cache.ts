import { type Request, type Response, type NextFunction } from "express";

/**
 * Middleware to disable caching for sensitive endpoints.
 * Prevents 304 (Not Modified) responses that can cache stale auth state.
 */
export function noCache(req: Request, res: Response, next: NextFunction) {
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  next();
}
