import express from "express";
import {
  // Announcements
  createAnnouncement,
  getAnnouncements,
  updateAnnouncement,
  deleteAnnouncement,
  
  // Messages/Chat
  getMessageRecipients,
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
import { scopeToSchool, requireActiveSchool } from "../middleware/tenant.middleware.js";

const router = express.Router();

router.use(verifyToken, scopeToSchool, requireActiveSchool);

// ==================== ANNOUNCEMENTS ====================
router.post("/announcements", checkRole(["admin", "teacher"]), createAnnouncement);
router.get("/announcements", getAnnouncements);
router.put("/announcements/:id", checkRole(["admin", "teacher"]), updateAnnouncement);
router.delete("/announcements/:id", checkRole(["admin", "teacher"]), deleteAnnouncement);

// ==================== MESSAGES/CHAT ====================
router.get("/recipients", getMessageRecipients);
router.post("/messages", sendMessage);
router.get("/messages", getMessages);
router.get("/conversations", getConversations);

// ==================== NOTIFICATIONS ====================
router.get("/notifications", getNotifications);
router.put("/notifications/:id/read", markNotificationAsRead);
router.put("/notifications/mark-all-read", markAllNotificationsAsRead);
router.get("/notifications/unread-count", getUnreadNotificationsCount);

export default router;
