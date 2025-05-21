import { Request, Response } from "express";
import jwt from "jsonwebtoken";

import config from "../config";
import * as authService from "../services/auth.service";
import { logger } from "../utils/logger";
import User from "../models/user.model";

const JWT_SECRET = config.jwt.secret;
const NOTIFICATION_URL = config.server.notification_url;

export const loginOrRegister = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: "Email et mot de passe requis" });
      return;
    }

    const authResponse = await authService.loginOrRegister(email, password);

    res.status(200).json(authResponse);
  } catch (error) {
    logger.error("Error in loginOrRegister controller", error);

    if (error instanceof Error) {
      if (error.message === "Compte désactivé. Contactez l'administrateur") {
        res.status(401).json({ message: error.message });
        return;
      } else if (error.message === "Mot de passe incorrect") {
        res.status(401).json({ message: "Email ou mot de passe incorrect" });
        return;
      }
    }

    res.status(500).json({ message: "Erreur lors de l'authentification" });
  }
};

export const resendConfirmationEmail = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email requis"
      });
    }

    // Trouver l'utilisateur
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur non trouvé"
      });
    }

    if (user.active) {
      return res.status(400).json({
        success: false,
        message: "Votre compte est déjà activé"
      });
    }

    const confirmationToken = jwt.sign({ email: user.email }, JWT_SECRET, {
      expiresIn: "24h"
    });

    user.confirmationToken = confirmationToken;
    await user.save();

    try {
      const response = await fetch(`${NOTIFICATION_URL}/send-confirmation`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: user.email,
          confirmationToken
        })
      });

      const result = await response.json();
      if (!result.success) {
        return res.status(500).json({
          success: false,
          message: "Échec de l'envoi de l'email de confirmation"
        });
      }

      return res.status(200).json({
        success: true,
        message: "Email de confirmation renvoyé avec succès"
      });
    } catch (error) {
      logger.error("Erreur lors de l'appel au service de notification", error);
      return res.status(500).json({
        success: false,
        message: "Erreur lors de l'envoi de l'email"
      });
    }
  } catch (error) {
    logger.error("Erreur lors du renvoi de l'email de confirmation", error);
    return res.status(500).json({
      success: false,
      message: "Erreur interne du serveur"
    });
  }
};

export const verifyEmail = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Token requis"
      });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { email: string };

      const user = await User.findOne({
        email: decoded.email,
        confirmationToken: token
      });

      if (!user) {
        return res.status(400).json({
          success: false,
          message: "Token invalide ou expiré"
        });
      }

      // Activer le compte
      user.active = true;
      user.confirmationToken = undefined; // Effacer le token après utilisation
      await user.save();

      return res.status(200).json({
        success: true,
        message: "Email vérifié avec succès. Votre compte est maintenant actif."
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: "Token invalide ou expiré"
      });
    }
  } catch (error) {
    logger.error("Erreur lors de la vérification de l'email", error);
    return res.status(500).json({
      success: false,
      message: "Erreur interne du serveur"
    });
  }
};

export const verifyPassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res
        .status(400)
        .json({ message: "Email et mot de passe requis", valid: false });
      return;
    }

    const isValid = await authService.verifyPassword(email, password);

    res.status(200).json({ valid: isValid });
  } catch (error) {
    logger.error("Error in verifyPassword controller", error);
    res
      .status(500)
      .json({ message: "Erreur lors de la vérification", valid: false });
  }
};
