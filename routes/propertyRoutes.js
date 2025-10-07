// routes/propertyRoutes.js
import express from "express";
import {
  createProperty,
  getProperties,
  getPropertyById,
  updateProperty,
  deleteProperty,
  deletePropertyImage,
} from "../Controller/propertyController.js";
import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();

// @route   POST /api/properties/create
// @desc    Create a new property with multiple images
// @access  Admin
router.post("/create", upload.array("images"), createProperty);

// @route   GET /api/properties
// @desc    Get all properties with optional filters
// @access  Public
// Query params: page, limit, city, location, propertyType, propertyStatus, minPrice, maxPrice, bhkCount, constructionStatus
router.get("/", getProperties);

// @route   GET /api/properties/:id
// @desc    Get single property by ID
// @access  Public
router.get("/:id", getPropertyById);

// @route   PUT /api/properties/:id
// @desc    Update a property by ID
// @access  Admin
router.put("/:id", upload.array("images", 10), updateProperty);

// @route   DELETE /api/properties/:id
// @desc    Delete a property by ID
// @access  Admin
router.delete("/:id", deleteProperty);

// **NEW: Delete single image from property**
router.delete("/:id/image", deletePropertyImage);

export default router;
