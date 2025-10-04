import mongoose from "mongoose";

// --- Define Schema ---
const BlogSchema = new mongoose.Schema(
  {
    imageUrl: {
      type: String,
      required: true,
    },
    date: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
    },
    tags: {
      type: [String],
    },
    description: {
      type: String,
      required: true,
    },
    isOnHomePage: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true } // auto adds createdAt & updatedAt
);

// --- Create Model ---
const Blog = mongoose.model("Blog", BlogSchema);

export default Blog;
