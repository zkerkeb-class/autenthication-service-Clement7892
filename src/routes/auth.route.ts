import { Router } from "express";
import * as authController from "../controllers/auth.controller";
import passport from "../config/passport.config";
import jwt from "jsonwebtoken";
import { logger } from "../utils/logger";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

router.post("/login-register", authController.loginOrRegister);

router.post("/verify-password", authController.verifyPassword);

router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// routes/auth.routes.ts
router.get(
  "/google/callback",
  (req, res, next) => {
    passport.authenticate("google", {
      failureRedirect: `${process.env.FRONTEND_URL}/auth?error=authentication_failed`,
      session: false
    })(req, res, next);
  },
  (req, res) => {
    try {
      if (!req.user) {
        logger.error("User object is undefined after authentication");
        return res.redirect(
          `${process.env.FRONTEND_URL}/auth?error=user_not_found`
        );
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

      // Rediriger vers le frontend avec token et données utilisateur
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

      // Encoder les données pour l'URL
      const encodedToken = encodeURIComponent(token);
      const encodedUser = encodeURIComponent(JSON.stringify(userInfo));

      // Rediriger vers le frontend
      return res.redirect(
        `${process.env.FRONTEND_URL}/auth/google-callback?token=${encodedToken}&user=${encodedUser}`
      );
    } catch (error) {
      logger.error("Erreur lors de la génération du token JWT", error);
      return res.redirect(
        `${process.env.FRONTEND_URL}/auth?error=token_generation_failed`
      );
    }
  }
);

export default router;
