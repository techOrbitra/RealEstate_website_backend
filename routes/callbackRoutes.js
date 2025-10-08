// routes/callbackRoutes.js
import express from "express";
import {
  createCallbackRequest,
  getAllCallbackRequests,
  getCallbackRequestById,
  updateCallbackRequestStatus,
  deleteCallbackRequest,
  getCallbackStats,
} from "../Controller/callbackController.js";

const router = express.Router();

// Public routes
router.post("/", createCallbackRequest);

// Admin routes (add authentication middleware as needed)
router.get("/", getAllCallbackRequests);
router.get("/stats", getCallbackStats);
router.get("/:id", getCallbackRequestById);
router.put("/:id", updateCallbackRequestStatus);
router.delete("/:id", deleteCallbackRequest);

export default router;
