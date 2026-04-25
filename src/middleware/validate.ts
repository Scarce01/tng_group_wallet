import type { RequestHandler } from "express";
import type { ZodSchema } from "zod";

export const validateBody =
  <T>(schema: ZodSchema<T>): RequestHandler =>
  (req, _res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) return next(result.error);
    req.body = result.data;
    next();
  };

export const validateQuery =
  <T>(schema: ZodSchema<T>): RequestHandler =>
  (req, _res, next) => {
    const result = schema.safeParse(req.query);
    if (!result.success) return next(result.error);
    (req as unknown as { validatedQuery: T }).validatedQuery = result.data;
    next();
  };
