import User from "../models/user.model";
import jwt from "jsonwebtoken";
import { logger } from "../utils/logger";
import {
  comparePassword,
  generateSalt,
  hashPassword
} from "../utils/password.utils";
import config from "../config";

const JWT_SECRET = config.jwt.secret;
const NOTIFICATION_URL = config.server.notification_url;

interface AuthResponse {
  user: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    active: boolean;
  };
  token: string;
}

export const loginOrRegister = async (
  email: string,
  password: string
): Promise<AuthResponse> => {
  try {
    const user = await User.findOne({ email });

    if (user) {
      if (!user.active) {
        throw new Error("Compte désactivé. Contactez l'administrateur");
      }

      const cleanPassword = password.trim();
      if (!cleanPassword) {
        throw new Error("Mot de passe requis");
      }

      const isPasswordValid = comparePassword(cleanPassword, user.password);
      if (!isPasswordValid) {
        throw new Error("Mot de passe incorrect");
      }

      const token = jwt.sign(
        {
          userId: user._id,
          email: user.email,
          role: user.role
        },
        JWT_SECRET,
        { expiresIn: 3600 }
      );

      logger.info(`Connexion réussie pour: ${email}`);

      return {
        user: {
          _id: user._id.toString(),
          firstName: user.firstName || "",
          lastName: user.lastName || "",
          email: user.email,
          role: user.role,
          active: user.active
        },
        token
      };
    } else {
      logger.info(`Nouvel utilisateur, création du compte: ${email}`);

      const salt = generateSalt();
      const hashedPassword = hashPassword(password, salt);

      const confirmationToken = jwt.sign({ email }, JWT_SECRET, {
        expiresIn: "24h"
      });

      const newUser = await User.create({
        email,
        password: hashedPassword,
        role: "user",
        active: false,
        confirmationToken: confirmationToken
      });

      try {
        const response = await fetch(`${NOTIFICATION_URL}/send-confirmation`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            email: newUser.email,
            confirmationToken: confirmationToken
          })
        });

        const result = await response.json();
        if (!result.success) {
          logger.error("Échec de l'envoi de l'email de confirmation", result);
        }
      } catch (error) {
        logger.error(
          "Erreur lors de l'appel au service de notification",
          error
        );
      }

      const token = jwt.sign(
        {
          userId: newUser._id,
          email: newUser.email,
          role: newUser.role,
          active: false
        },
        JWT_SECRET,
        { expiresIn: 3600 }
      );

      return {
        user: {
          _id: newUser._id.toString(),
          firstName: newUser.firstName || "",
          lastName: newUser.lastName || "",
          email: newUser.email,
          role: newUser.role,
          active: false
        },
        token
      };
    }
  } catch (error) {
    logger.error("Error in loginOrRegister service", error);
    throw error;
  }
};

// Ajouter cette fonction à votre auth.service.ts

export const verifyPassword = async (
  email: string,
  password: string
): Promise<boolean> => {
  try {
    // Trouver l'utilisateur par email
    const user = await User.findOne({ email });

    // Si l'utilisateur n'existe pas
    if (!user) {
      return false;
    }

    // Vérifier si le compte est actif
    if (!user.active) {
      return false;
    }

    // Vérifier le mot de passe
    const cleanPassword = password.trim();
    if (!cleanPassword) {
      return false;
    }

    const isPasswordValid = comparePassword(cleanPassword, user.password);
    return isPasswordValid;
  } catch (error) {
    logger.error("Error in verifyPassword service", error);
    return false;
  }
};
