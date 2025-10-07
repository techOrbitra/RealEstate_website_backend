// routes/leadRoutes.js - SINGLE FILE FOR BOTH
import express from "express";
import {
  submitBlundersLead,
  getAllBlundersLeads,
} from "../Controller/blundersLeadController.js";
import {
  submitStrategiesLead,
  getAllStrategiesLeads,
} from "../Controller/strategiesLeadController.js";

const router = express.Router();

// ========================================
// BLUNDERS LEAD ROUTES
// ========================================

// @route   POST /api/leads/blunders/submit
router.post("/blunders/submit", submitBlundersLead);

// @route   GET /api/leads/blunders/all
router.get("/blunders/all", getAllBlundersLeads);

// ========================================
// STRATEGIES LEAD ROUTES
// ========================================

// @route   POST /api/leads/strategies/submit
router.post("/strategies/submit", submitStrategiesLead);

// @route   GET /api/leads/strategies/all
router.get("/strategies/all", getAllStrategiesLeads);

export default router;
