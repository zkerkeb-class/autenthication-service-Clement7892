import { Router } from "express";
import * as userController from "../controllers/user.controller";
import {
  authMiddleware,
  adminMiddleware,
  managerMiddleware
} from "../middlewares/auth.middleware";

const router = Router();

router.use(authMiddleware);

router.get("/:id", userController.getUserById);
router.put("/:id", userController.updateUser);
router.post("/:id/change-password", userController.changePassword);

router.get("/", userController.getAllUsers);
router.post("/", adminMiddleware, userController.createUser);
router.delete("/:id", adminMiddleware, userController.deleteUser);

export default router;
