// models/newsletterModel.js
import mongoose from "mongoose";

const NewsletterSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please provide a valid email address",
      ],
    },
    subscribedAt: {
      type: Date,
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // Optional: Track where the subscription came from
    source: {
      type: String,
      default: "footer",
      enum: ["footer", "popup", "landing_page", "other"],
    },
    // Optional: Store IP address for analytics
    ipAddress: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster email lookups
NewsletterSchema.index({ email: 1 });

const Newsletter =
  mongoose.models.Newsletter || mongoose.model("Newsletter", NewsletterSchema);

export default Newsletter;
