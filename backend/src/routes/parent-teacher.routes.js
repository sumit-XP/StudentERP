import express from "express";
import {
    // Parent-Teacher Meetings
    scheduleMeeting,
    getMeetings,
    getMeetingById,
    updateMeeting,
    updateMeetingStatus,
    cancelMeeting,

    // Parent Feedback
    submitFeedback,
    getFeedback,
    getFeedbackById,
    updateFeedbackStatus,
    resolveFeedback,

    // Task 5: PTM APIs
    schedulePTM,
    getUpcomingMeetings,
    cancelPTM
} from "../modules/parent-teacher/parent-teacher.controller.js";
import { verifyToken } from "../middleware/auth.middleware.js";
import { checkRole } from "../middleware/role.middleware.js";

const router = express.Router();

// ==================== TASK 5: PARENT-TEACHER MEETING APIS ====================
router.post("/ptm/schedule", verifyToken, checkRole(["admin"]), schedulePTM);
router.get("/ptm/upcoming", verifyToken, getUpcomingMeetings);
router.patch("/ptm/:id/cancel", verifyToken, checkRole(["admin"]), cancelPTM);

// ==================== PARENT-TEACHER MEETINGS (Legacy) ====================
router.post("/meetings", verifyToken, checkRole(["admin", "teacher", "parent"]), scheduleMeeting);
router.get("/meetings", verifyToken, getMeetings);
router.get("/meetings/:id", verifyToken, getMeetingById);
router.put("/meetings/:id", verifyToken, checkRole(["admin", "teacher", "parent"]), updateMeeting);
router.put("/meetings/:id/status", verifyToken, checkRole(["admin", "teacher"]), updateMeetingStatus);
router.delete("/meetings/:id", verifyToken, checkRole(["admin", "teacher", "parent"]), cancelMeeting);

// ==================== PARENT FEEDBACK ====================
router.post("/feedback", verifyToken, checkRole(["parent"]), submitFeedback);
router.get("/feedback", verifyToken, getFeedback);
router.get("/feedback/:id", verifyToken, getFeedbackById);
router.put("/feedback/:id/status", verifyToken, checkRole(["admin"]), updateFeedbackStatus);
router.put("/feedback/:id/resolve", verifyToken, checkRole(["admin", "teacher"]), resolveFeedback);

export default router;
