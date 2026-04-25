import { Router } from "express";
import rateLimit from "express-rate-limit";
import { validateBody } from "../middleware/validate.js";
import { asyncHandler } from "../utils/async.js";
import { loginSchema, refreshSchema, registerSchema } from "../schemas/auth.schema.js";
import * as authService from "../services/auth.service.js";

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
});

router.post(
  "/register",
  authLimiter,
  validateBody(registerSchema),
  asyncHandler(async (req, res) => {
    const result = await authService.register(req.body);
    res.status(201).json(result);
  })
);

router.post(
  "/login",
  authLimiter,
  validateBody(loginSchema),
  asyncHandler(async (req, res) => {
    const result = await authService.login(req.body.phone, req.body.pin);
    res.json(result);
  })
);

router.post(
  "/refresh",
  validateBody(refreshSchema),
  asyncHandler(async (req, res) => {
    const result = await authService.refresh(req.body.refreshToken);
    res.json(result);
  })
);

router.post(
  "/logout",
  validateBody(refreshSchema),
  asyncHandler(async (req, res) => {
    await authService.logout(req.body.refreshToken);
    res.status(204).end();
  })
);

export default router;
