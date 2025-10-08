// routes/contactRoutes.js
import express from "express";
import {
  createContact,
  getAllContactsSimple,
  getContactById,
  deleteContact,
} from "../Controller/contactController.js";

const router = express.Router();

// ==================== PUBLIC ROUTES ====================
// @route   POST /api/contacts
// @desc    Create new contact submission
// @access  Public
router.post("/create", createContact);

// @route   GET /api/contacts/admin/all-simple
// @desc    Get all contacts without pagination
// @access  Private/Admin
router.get("/admin/all-simple", getAllContactsSimple);

// @route   GET /api/contacts/:id
// @desc    Get contact by ID
// @access  Private/Admin
router.get("/getbyid/:id", getContactById);

// @route   DELETE /api/contacts/:id
// @desc    Delete contact
// @access  Private/Admin
router.delete("/delete/:id", deleteContact);

export default router;
