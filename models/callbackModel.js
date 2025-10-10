// models/callbackModel.js
import mongoose from "mongoose";

const CallbackRequestSchema = new mongoose.Schema(
  {
    // Property Information
    propertyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },
    propertyTitle: {
      type: String,
      required: true,
      trim: true,
    },

    // User Information
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please provide a valid email address",
      ],
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
    },
    message: {
      type: String,
      trim: true,
      maxlength: [500, "Message cannot exceed 500 characters"],
    },

    // Preferred callback time (optional)
    preferredTime: {
      type: String,
      enum: ["Morning", "Afternoon", "Evening", "Anytime"],
      default: "Anytime",
    },

    // Request Status
    status: {
      type: String,
      enum: ["Pending", "Contacted", "Completed", "Cancelled"],
      default: "Pending",
    },

    // Admin Notes
    adminNotes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
CallbackRequestSchema.index({ propertyId: 1 });
CallbackRequestSchema.index({ email: 1 });
CallbackRequestSchema.index({ status: 1 });
CallbackRequestSchema.index({ createdAt: -1 });

const CallbackRequest =
  mongoose.models.CallbackRequest ||
  mongoose.model("CallbackRequest", CallbackRequestSchema);

export default CallbackRequest;
