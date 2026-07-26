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
router.post("/login", loginUser);

// Protected routes
router.post("/register", verifyToken, checkRole(["super_admin", "admin", "teacher"]), registerUser);
router.get("/profile", verifyToken, getUserProfile);
router.put("/profile", verifyToken, updateUserProfile);
router.put("/change-password", verifyToken, changePassword);
router.post("/logout", verifyToken, logoutUser);

// Admin / super_admin routes
router.get("/users", verifyToken, checkRole(["admin", "super_admin"]), getAllUsers);

// Test protected route
router.get("/protected", verifyToken, checkRole(["admin"]), (req, res) => {
  res.json({ message: "Welcome Admin, access granted!" });
});

export default router;
