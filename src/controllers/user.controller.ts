import { Request, Response } from "express";

import * as userService from "../services/user.service";
import { logger } from "../utils/logger";
import { comparePassword } from "../utils/password.utils";
import { IUser } from "../types";

export const getAllUsers = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const users = await userService.getAllUsers();
    res.status(200).json(users);
  } catch (error) {
    logger.error("Error in getAllUsers controller", error);
    res
      .status(500)
      .json({ message: "Erreur lors de la récupération des utilisateurs" });
  }
};

export const getUserById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const user = await userService.getUserById(req.params.id);
    if (!user) {
      res.status(404).json({ message: "Utilisateur non trouvé" });
      return;
    }
    res.status(200).json(user);
  } catch (error) {
    logger.error(
      `Error in getUserById controller for id ${req.params.id}`,
      error
    );
    res
      .status(500)
      .json({ message: "Erreur lors de la récupération de l'utilisateur" });
  }
};

export const updateUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const updatedUser = await userService.updateUser(req.params.id, req.body);
    if (!updatedUser) {
      res.status(404).json({ message: "Utilisateur non trouvé" });
      return;
    }
    res.status(200).json(updatedUser);
  } catch (error) {
    logger.error(
      `Error in updateUser controller for id ${req.params.id}`,
      error
    );
    res
      .status(500)
      .json({ message: "Erreur lors de la mise à jour de l'utilisateur" });
  }
};

export const createUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userData: IUser = req.body;
    const newUser = await userService.createUser(userData);
    res.status(201).json(newUser);
  } catch (error) {
    logger.error("Error in createUser controller", error);
    res
      .status(500)
      .json({ message: "Erreur lors de la création de l'utilisateur" });
  }
};
export const deleteUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const deletedUser = await userService.deleteUser(req.params.id);
    if (!deletedUser) {
      res.status(404).json({ message: "Utilisateur non trouvé" });
      return;
    }
    res.status(200).json({ message: "Utilisateur supprimé avec succès" });
  } catch (error) {
    logger.error(
      `Error in deleteUser controller for id ${req.params.id}`,
      error
    );
    res
      .status(500)
      .json({ message: "Erreur lors de la suppression de l'utilisateur" });
  }
};

export const changePassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400).json({
        message: "Mot de passe actuel et nouveau mot de passe requis"
      });
      return;
    }

    // Vérifier si l'utilisateur existe
    const user = await userService.getUserById(req.params.id);
    if (!user) {
      res.status(404).json({ message: "Utilisateur non trouvé" });
      return;
    }

    // On doit récupérer l'utilisateur avec le mot de passe pour la vérification
    const userWithPassword = await userService.getUserByEmail(user.email);
    if (!userWithPassword) {
      res.status(404).json({ message: "Utilisateur non trouvé" });
      return;
    }

    // Vérifier le mot de passe actuel
    const isMatch = await comparePassword(
      currentPassword,
      userWithPassword.password
    );
    if (!isMatch) {
      res.status(401).json({ message: "Mot de passe actuel incorrect" });
      return;
    }

    // Mettre à jour le mot de passe
    const success = await userService.updatePassword(
      req.params.id,
      newPassword
    );
    if (!success) {
      res
        .status(500)
        .json({ message: "Erreur lors du changement de mot de passe" });
      return;
    }

    res.status(200).json({ message: "Mot de passe changé avec succès" });
  } catch (error) {
    logger.error(
      `Error in changePassword controller for id ${req.params.id}`,
      error
    );
    res
      .status(500)
      .json({ message: "Erreur lors du changement de mot de passe" });
  }
};
