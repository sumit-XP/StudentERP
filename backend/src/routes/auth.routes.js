import express from "express";
import { 
  registerUser, 
  loginUser, 
  getUserProfile, 
  updateUserProfile, 
  changePassword, 
  logoutUser, 
  getAllUsers 
} from "../modules/auth/auth.controller.js";
import { verifyToken } from "../middleware/auth.middleware.js";
import { checkRole } from "../middleware/role.middleware.js";

const router = express.Router();

// Public routes
router.post("/register", registerUser);
router.post("/login", loginUser);

// Protected routes
router.get("/profile", verifyToken, getUserProfile);
router.put("/profile", verifyToken, updateUserProfile);
router.put("/change-password", verifyToken, changePassword);
router.post("/logout", verifyToken, logoutUser);

// Admin only routes
router.get("/users", verifyToken, checkRole(["admin"]), getAllUsers);

// Test protected route
router.get("/protected", verifyToken, checkRole(["admin"]), (req, res) => {
  res.json({ message: "Welcome Admin, access granted!" });
});

export default router;
