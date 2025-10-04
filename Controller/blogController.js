import Blog from "../models/Blog.js";

// Helper to ensure tags is an array of strings
const normalizeTags = (input) => {
  if (input == null) return [];
  // If already an array, map to trimmed strings
  if (Array.isArray(input))
    return input.map((t) => String(t).trim()).filter(Boolean);
  // If comma-separated string, split
  if (typeof input === "string") {
    return input
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
  }
  // Fallback: try to cast to string
  return [String(input).trim()].filter(Boolean);
};

// Helper function to convert any date to DD-MM-YYYY
const formatDateToDDMMYYYY = (dateInput) => {
  if (!dateInput) return null;
  const dateObj = new Date(dateInput);
  if (isNaN(dateObj)) return null;
  const day = String(dateObj.getDate()).padStart(2, "0");
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const year = dateObj.getFullYear();
  return `${day}-${month}-${year}`;
};

// @desc   Create a new Blog
// @route  POST /api/blogs/create
export const createBlog = async (req, res) => {
  try {
    let { date, title, description, category, tags } = req.body;
    const imageUrl = req.file?.path;
    console.log(date, title, description, category, tags, imageUrl);

    if (!imageUrl || !date || !title || !description) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Convert date to DD-MM-YYYY
    date = formatDateToDDMMYYYY(date);
    if (!date) {
      return res.status(400).json({ message: "Invalid date format" });
    }

    // Ensure tags is array of strings
    const normalizedTags = normalizeTags(tags);

    const newBlog = new Blog({
      imageUrl,
      date,
      title,
      description,
      category: category || undefined,
      tags: normalizedTags,
    });

    await newBlog.save();

    res.status(201).json({
      message: "Blog created successfully",
      blog: newBlog,
    });
  } catch (error) {
    console.error("Error creating blog:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc   Get all Blogs
// @route  GET /api/blogs
export const getBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find().sort({ createdAt: -1 });
    res.json(blogs);
  } catch (error) {
    console.error("Error fetching blogs:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc   Update Blog (partial or full)
// @route  PUT /api/blogs/:id
export const updateBlog = async (req, res) => {
  try {
    let { date, title, description, category, tags } = req.body;

    const updateData = {};

    if (typeof title !== "undefined") updateData.title = title;
    if (typeof description !== "undefined")
      updateData.description = description;
    if (typeof category !== "undefined") updateData.category = category;
    if (typeof tags !== "undefined") updateData.tags = normalizeTags(tags);

    if (date) {
      const formatted = formatDateToDDMMYYYY(date);
      if (!formatted) {
        return res.status(400).json({ message: "Invalid date format" });
      }
      updateData.date = formatted;
    }

    if (req.file?.path) updateData.imageUrl = req.file.path;

    const updatedBlog = await Blog.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      {
        new: true,
        runValidators: true, // ensure string validators/casting on update
      }
    );

    if (!updatedBlog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    res.json({ message: "Blog updated successfully", blog: updatedBlog });
  } catch (error) {
    console.error("Error updating blog:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc   Delete Blog
// @route  DELETE /api/blogs/:id
export const deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findByIdAndDelete(req.params.id);
    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }
    res.json({ message: "Blog deleted successfully" });
  } catch (error) {
    console.error("Error deleting blog:", error);
    res.status(500).json({ message: "Server Error" });
  }
};
