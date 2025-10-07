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

//pagination wise api for blog getting
// export const getBlogsPagination = async (req, res) => {
//   try {
//     const { page = 1, limit = 9, category, search } = req.query;

//     // Build query
//     const query = {};

//     // Category filter
//     if (category && category !== "All") {
//       query.category = category;
//     }

//     // Search filter (search in title and description)
//     if (search) {
//       query.$or = [
//         { title: { $regex: search, $options: "i" } },
//         { description: { $regex: search, $options: "i" } },
//       ];
//     }

//     // Calculate pagination
//     const skip = (parseInt(page) - 1) * parseInt(limit);
//     const limitNum = parseInt(limit);

//     // Execute query with pagination
//     // Only select fields needed for blog listing page (not full description)
//     const blogs = await Blog.find(query)
//       .select("_id title imageUrl date category tags createdAt") // Exclude full description for performance
//       .sort({ createdAt: -1 }) // Latest first
//       .skip(skip)
//       .limit(limitNum)
//       .lean(); // Returns plain JS objects (faster)

//     // Get total count for pagination
//     const totalBlogs = await Blog.countDocuments(query);
//     const totalPages = Math.ceil(totalBlogs / limitNum);

//     res.status(200).json({
//       success: true,
//       blogs,
//       pagination: {
//         currentPage: parseInt(page),
//         totalPages,
//         totalBlogs,
//         limit: limitNum,
//         hasNextPage: parseInt(page) < totalPages,
//         hasPrevPage: parseInt(page) > 1,
//       },
//     });
//   } catch (error) {
//     console.error("Error fetching blogs with pagination:", error);
//     res.status(500).json({
//       success: false,
//       message: "Failed to fetch blogs",
//       error: error.message,
//     });
//   }
// };

// backend/controllers/blogController.js - UPDATED WITH SORT
export const getBlogsPagination = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 9,
      category,
      search,
      sort = "newest", // Add sort parameter with default
    } = req.query;

    // Build query
    const query = {};

    // Category filter
    if (category && category !== "All") {
      query.category = category;
    }

    // Search filter (search in title and description)
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);

    // Determine sort order based on sort parameter
    let sortOption;
    if (sort === "oldest") {
      sortOption = { createdAt: 1 }; // Oldest first (ascending)
    } else {
      sortOption = { createdAt: -1 }; // Newest first (descending) - default
    }

    // Execute query with pagination and sorting
    const blogs = await Blog.find(query)
      .select("_id title imageUrl date category tags createdAt")
      .sort(sortOption) // Apply dynamic sort
      .skip(skip)
      .limit(limitNum)
      .lean();

    // Get total count for pagination
    const totalBlogs = await Blog.countDocuments(query);
    const totalPages = Math.ceil(totalBlogs / limitNum);

    res.status(200).json({
      success: true,
      blogs,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalBlogs,
        limit: limitNum,
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching blogs with pagination:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch blogs",
      error: error.message,
    });
  }
};

// ========================================
// GET SINGLE BLOG BY ID (Optimized for Blog Details Page)
// ========================================
export const getBlogById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ObjectId
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: "Invalid blog ID format",
      });
    }

    // Fetch full blog with all fields
    const blog = await Blog.findById(id).lean();

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
      });
    }

    res.status(200).json({
      success: true,
      blog,
    });
  } catch (error) {
    console.error("Error fetching blog by ID:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch blog",
      error: error.message,
    });
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
// @access Public
export const getHomePageBlogs = async (req, res) => {
  try {
    const homePageBlogs = await Blog.find({ isOnHomePage: true })
      .select("imageUrl date title category")
      .sort({ createdAt: -1 })
      .limit(3);

    res.status(200).json({
      success: true,
      count: homePageBlogs.length,
      blogs: homePageBlogs,
    });
  } catch (error) {
    console.error("Error fetching homepage blogs:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

// hlper apis
// ========================================
// GET ALL UNIQUE CATEGORIES
// ========================================
export const getCategories = async (req, res) => {
  try {
    // Get distinct categories (excluding null/empty)
    const categories = await Blog.distinct("category", {
      category: { $exists: true, $ne: null, $ne: "" },
    });

    res.status(200).json({
      success: true,
      categories: categories.sort(), // Alphabetically sorted
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch categories",
      error: error.message,
    });
  }
};

// ========================================
// GET RELATED BLOGS (For Blog Details Page)
// ========================================
export const getRelatedBlogs = async (req, res) => {
  try {
    const { category, exclude, limit = 2 } = req.query;

    if (!category) {
      return res.status(400).json({
        success: false,
        message: "Category is required",
      });
    }

    const query = {
      category,
      _id: { $ne: exclude }, // Exclude current blog
    };

    const relatedBlogs = await Blog.find(query)
      .select("_id title imageUrl date category tags createdAt")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .lean();

    res.status(200).json({
      success: true,
      blogs: relatedBlogs,
    });
  } catch (error) {
    console.error("Error fetching related blogs:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch related blogs",
      error: error.message,
    });
  }
};

// ========================================
// SEARCH BLOGS (Autocomplete/Suggestions)
// ========================================
export const searchBlogs = async (req, res) => {
  try {
    const { q, limit = 5 } = req.query;

    if (!q || q.length < 2) {
      return res.status(400).json({
        success: false,
        message: "Search query must be at least 2 characters",
      });
    }

    const blogs = await Blog.find({
      $or: [
        { title: { $regex: q, $options: "i" } },
        { tags: { $in: [new RegExp(q, "i")] } },
      ],
    })
      .select("_id title category")
      .limit(parseInt(limit))
      .lean();

    res.status(200).json({
      success: true,
      results: blogs,
    });
  } catch (error) {
    console.error("Error searching blogs:", error);
    res.status(500).json({
      success: false,
      message: "Failed to search blogs",
      error: error.message,
    });
  }
};
