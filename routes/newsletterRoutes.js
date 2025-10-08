// routes/newsletterRoutes.js
import express from "express";
import {
  subscribeNewsletter,
  unsubscribeNewsletter,
  getAllSubscribers,
  deleteSubscriber,
  getNewsletterStats,
} from "../Controller/newsletterController.js";

const router = express.Router();

// Public routes
router.post("/subscribe", subscribeNewsletter);
router.post("/unsubscribe", unsubscribeNewsletter);

// Admin routes (add authentication middleware as needed)
router.get("/subscribers", getAllSubscribers);
router.get("/stats", getNewsletterStats);
router.delete("/:id", deleteSubscriber);

export default router;
