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
      index: true,
    },
    tags: {
      type: [String],
      index: true,
    },
    description: {
      type: String,
      required: true,
    },
    isOnHomePage: {
      type: Boolean,
      default: false,
      index: true,  
    },
  },
  { timestamps: true } // auto adds createdAt & updatedAt
);

// Compound index for common queries
BlogSchema.index({ createdAt: -1, category: 1 });
BlogSchema.index({ title: "text", description: "text" }); // Text search index
// --- Create Model ---
const Blog = mongoose.model("Blog", BlogSchema);

export default Blog;
