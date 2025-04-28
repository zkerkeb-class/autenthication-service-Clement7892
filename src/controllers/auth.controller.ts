import { Request, Response } from "express";
import * as authService from "../services/auth.service";
import { logger } from "../utils/logger";

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
