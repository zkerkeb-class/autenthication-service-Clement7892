import { Router } from "express";
const router = Router();
import jwt from "jsonwebtoken";


import { logger } from "../utils/logger";
import config from "../config";

import passport from "../config/passport.config";
import * as authController from "../controllers/auth.controller";

const JWT_SECRET = config.jwt.secret;
const FRONTEND_URL = config.server.frontend_url;

router.post("/login-register", authController.loginOrRegister);
router.post("/verify-password", authController.verifyPassword);
router.post("/resend-confirmation", authController.resendConfirmationEmail);
router.post("/verify-email", authController.verifyEmail);
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);
router.get(
  "/google/callback",
  (req, res, next) => {
    passport.authenticate("google", {
      failureRedirect: `${FRONTEND_URL}/auth?error=authentication_failed`,
      session: false
    })(req, res, next);
  },
  (req, res) => {
    try {
      if (!req.user) {
        logger.error("User object is undefined after authentication");
        return res.redirect(`${FRONTEND_URL}/auth?error=user_not_found`);
      }

      const user = req.user as any;

      const token = jwt.sign(
        {
          userId: user._id,
          email: user.email,
          role: user.role
        },
        JWT_SECRET,
        { expiresIn: "1h" }
      );

      const userInfo = {
        _id: user._id.toString(),
        email: user.email,
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        role: user.role,
        provider: user.provider,
        teams: user.teams || [],
        companyId: user.companyId,
        lastLogin: user.lastLogin,
        active: user.active
      };

      const encodedToken = encodeURIComponent(token);
      const encodedUser = encodeURIComponent(JSON.stringify(userInfo));

      return res.redirect(
        `${FRONTEND_URL}/auth/google-callback?token=${encodedToken}&user=${encodedUser}`
      );
    } catch (error) {
      logger.error("Erreur lors de la génération du token JWT", error);
      return res.redirect(`${FRONTEND_URL}/auth?error=token_generation_failed`);
    }
  }
);

export default router;
