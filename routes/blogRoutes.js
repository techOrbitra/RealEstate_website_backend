import express from "express";
import {
  createBlog,
  getBlogs,
  updateBlog,
  deleteBlog,
  getHomePageBlogs,
  addToHomePage,
  removeFromHomePage,
} from "../Controller/blogController.js";
import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();

// Route: Create a new blog
router.post("/create", upload.single("image"), createBlog);

// Route: Get all blogs
router.get("/", getBlogs);

// Route: put a blog by ID
router.put("/:id", upload.single("image"), updateBlog);

// Route: Delete a blog

router.delete("/:id", deleteBlog);

// Route: Get homepage blogs (max 3)
router.get("/homepage", getHomePageBlogs);

// Route: Add blog to homepage
router.patch("/:id/add-to-home", addToHomePage);

// Route: Remove blog from homepage
router.patch("/:id/remove-from-home", removeFromHomePage);

export default router;
