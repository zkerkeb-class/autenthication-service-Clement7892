import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

import { logger } from "../utils/logger";
import config from "../config";

interface DecodedToken {
  userId: string;
  email: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      jwtUser?: DecodedToken;
    }
  }
}

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      res.status(401).json({ message: "Authentification requise" });
      return;
    }

    const jwtSecret = config.jwt.secret;
    const decoded = jwt.verify(token, jwtSecret) as DecodedToken;

    req.jwtUser = decoded; // Utiliser jwtUser au lieu de user
    next();
  } catch (error) {
    logger.error("Authentication error", error);
    res.status(401).json({ message: "Token invalide" });
  }
};

export const adminMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (req.jwtUser?.role !== "admin") {
    // Mettre à jour ici aussi
    res
      .status(403)
      .json({ message: "Accès refusé. Droits d'administrateur requis" });
    return;
  }
  next();
};

export const managerMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (req.jwtUser?.role !== "admin" && req.jwtUser?.role !== "manager") {
    // Et ici
    res.status(403).json({ message: "Accès refusé. Droits de manager requis" });
    return;
  }
  next();
};
