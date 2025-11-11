import express from "express";
import {
  // Announcements
  createAnnouncement,
  getAnnouncements,
  updateAnnouncement,
  deleteAnnouncement,
  
  // Messages/Chat
  sendMessage,
  getMessages,
  getConversations,
  
  // Notifications
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUnreadNotificationsCount
} from "../modules/communication/communication.controller.js";
import { verifyToken } from "../middleware/auth.middleware.js";
import { checkRole } from "../middleware/role.middleware.js";

const router = express.Router();

// ==================== ANNOUNCEMENTS ====================
router.post("/announcements", verifyToken, checkRole(["admin", "teacher"]), createAnnouncement);
router.get("/announcements", verifyToken, getAnnouncements);
router.put("/announcements/:id", verifyToken, checkRole(["admin", "teacher"]), updateAnnouncement);
router.delete("/announcements/:id", verifyToken, checkRole(["admin", "teacher"]), deleteAnnouncement);

// ==================== MESSAGES/CHAT ====================
router.post("/messages", verifyToken, sendMessage);
router.get("/messages", verifyToken, getMessages);
router.get("/conversations", verifyToken, getConversations);

// ==================== NOTIFICATIONS ====================
router.get("/notifications", verifyToken, getNotifications);
router.put("/notifications/:id/read", verifyToken, markNotificationAsRead);
router.put("/notifications/mark-all-read", verifyToken, markAllNotificationsAsRead);
router.get("/notifications/unread-count", verifyToken, getUnreadNotificationsCount);

export default router;
