// routes/authRoutes.js - WITH ADMIN MANAGEMENT
import express from "express";
import {
  adminLogin,
  verifyToken,
  getAdminProfile,
  createAdmin,
  getAllAdmins,
  createNewAdmin,
  updateAdmin,
  deleteAdmin,
  toggleAdminStatus,
} from "../Controller/authController.js";
import { protect, superAdminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public routes
router.post("/login", adminLogin);
router.post("/verify", verifyToken);

// Create initial admin (comment out after first use)
router.post("/create-admin", createAdmin);

// Protected routes
router.get("/profile", protect, getAdminProfile);

// Super-admin only routes
router.get("/admins", protect, superAdminOnly, getAllAdmins);
router.post("/admins", protect, superAdminOnly, createNewAdmin);
router.put("/admins/:id", protect, superAdminOnly, updateAdmin);
router.delete("/admins/:id", protect, superAdminOnly, deleteAdmin);
router.patch(
  "/admins/:id/toggle-status",
  protect,
  superAdminOnly,
  toggleAdminStatus
);

export default router;
