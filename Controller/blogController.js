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
      isOnHomePage: false, // ✅ explicitly set
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

// @desc   Add blog to homepage (max 3 allowed)
// @route  PATCH /api/blogs/:id/add-to-home
export const addToHomePage = async (req, res) => {
  try {
    const blogId = req.params.id;

    // Check if blog exists
    const blog = await Blog.findById(blogId);
    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    // Check if already on homepage
    if (blog.isOnHomePage) {
      return res.status(400).json({
        message: "This blog is already on the homepage",
      });
    }

    // Count current blogs on homepage
    const homepageCount = await Blog.countDocuments({ isOnHomePage: true });

    // Check if limit reached
    if (homepageCount >= 3) {
      return res.status(400).json({
        message:
          "Homepage limit reached. Maximum 3 blogs allowed on homepage. Please remove one first.",
      });
    }

    // Update blog to add to homepage
    const updatedBlog = await Blog.findByIdAndUpdate(
      blogId,
      { $set: { isOnHomePage: true } },
      { new: true, runValidators: true }
    );

    res.json({
      message: "Blog added to homepage successfully",
      blog: updatedBlog,
      homepageCount: homepageCount + 1,
    });
  } catch (error) {
    console.error("Error adding blog to homepage:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc   Remove blog from homepage
// @route  PATCH /api/blogs/:id/remove-from-home
export const removeFromHomePage = async (req, res) => {
  try {
    const blogId = req.params.id;

    // Check if blog exists
    const blog = await Blog.findById(blogId);
    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    // Check if blog is on homepage
    if (!blog.isOnHomePage) {
      return res.status(400).json({
        message: "This blog is not on the homepage",
      });
    }

    // Update blog to remove from homepage
    const updatedBlog = await Blog.findByIdAndUpdate(
      blogId,
      { $set: { isOnHomePage: false } },
      { new: true, runValidators: true }
    );

    // Get updated count
    const homepageCount = await Blog.countDocuments({ isOnHomePage: true });

    res.json({
      message: "Blog removed from homepage successfully",
      blog: updatedBlog,
      homepageCount,
    });
  } catch (error) {
    console.error("Error removing blog from homepage:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc   Get all homepage blogs
// @route  GET /api/blogs/homepage
export const getHomePageBlogs = async (req, res) => {
  try {
    const homePageBlogs = await Blog.find({ isOnHomePage: true })
      .sort({ createdAt: -1 })
      .limit(3);

    res.json({
      count: homePageBlogs.length,
      blogs: homePageBlogs,
    });
  } catch (error) {
    console.error("Error fetching homepage blogs:", error);
    res.status(500).json({ message: "Server Error" });
  }
};
