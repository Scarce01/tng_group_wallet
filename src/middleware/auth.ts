import type { RequestHandler } from "express";
import { Errors } from "../utils/errors.js";
import { verifyAccessToken } from "../utils/jwt.js";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userPhone?: string;
    }
  }
}

export const requireAuth: RequestHandler = (req, _res, next) => {
  const header = req.header("authorization") ?? req.header("Authorization");
  if (!header?.startsWith("Bearer ")) {
    return next(Errors.unauthenticated("Missing bearer token"));
  }
  const token = header.slice("Bearer ".length).trim();
  try {
    const payload = verifyAccessToken(token);
    req.userId = payload.sub;
    req.userPhone = payload.phone;
    next();
  } catch {
    return next(Errors.unauthenticated("Invalid or expired token"));
  }
};
