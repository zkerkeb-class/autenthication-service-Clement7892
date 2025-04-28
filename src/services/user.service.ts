import User from "../models/user.model";
import { IUser } from "../types";
import { logger } from "../utils/logger";
import mongoose from "mongoose";
import { generateSalt, hashPassword } from "../utils/password.utils";
type UserDocument = mongoose.Document & IUser;

export const getAllUsers = async (): Promise<IUser[]> => {
  try {
    const users = await User.find().select("-password").sort({ lastName: 1 });
    return users.map((user) => user.toObject());
  } catch (error) {
    logger.error("Error fetching all users", error);
    throw error;
  }
};

export const getUserById = async (id: string): Promise<IUser | null> => {
  try {
    const user = await User.findById(id).select("-password");
    return user ? user.toObject() : null;
  } catch (error) {
    logger.error(`Error fetching user with id ${id}`, error);
    throw error;
  }
};

export const getUserByEmail = async (
  email: string
): Promise<UserDocument | null> => {
  try {
    return await User.findOne({ email });
  } catch (error) {
    logger.error(`Error fetching user with email ${email}`, error);
    throw error;
  }
};

export const createUser = async (userData: IUser): Promise<IUser> => {
  try {
    console.log(userData.password);
    if (userData.password) {
      const salt = generateSalt();
      userData.password = hashPassword(userData.password, salt);
    }

    console.log(userData.password);

    const newUser = new User(userData);
    const savedUser = await newUser.save();
    return savedUser.toObject();
  } catch (error) {
    logger.error("Error creating new user", error);
    throw error;
  }
};

export const updateUser = async (
  id: string,
  userData: Partial<IUser>
): Promise<IUser | null> => {
  try {
    if (userData.password) {
      delete userData.password;
    }

    const updatedUser = await User.findByIdAndUpdate(id, userData, {
      new: true
    }).select("-password");
    return updatedUser ? updatedUser.toObject() : null;
  } catch (error) {
    logger.error(`Error updating user with id ${id}`, error);
    throw error;
  }
};

export const deleteUser = async (id: string): Promise<IUser | null> => {
  try {
    const deletedUser = await User.findByIdAndDelete(id);
    return deletedUser ? deletedUser.toObject() : null;
  } catch (error) {
    logger.error(`Error deleting user with id ${id}`, error);
    throw error;
  }
};

export const updatePassword = async (
  id: string,
  newPassword: string
): Promise<boolean> => {
  try {
    const user = await User.findById(id);
    if (!user) return false;

    const salt = generateSalt();
    const hashedPassword = hashPassword(newPassword, salt);

    user.password = hashedPassword;
    await user.save();

    return true;
  } catch (error) {
    logger.error(`Error updating password for user with id ${id}`, error);
    throw error;
  }
};
