// models/propertyModel.js
import mongoose from "mongoose";

// --- Unit Type Sub-Schema ---
const UnitTypeSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      trim: true,
      // Examples: "Studio", "1 BHK", "2 BHK", "3 BHK", "4 BHK", "Villa", "Penthouse"
    },
    totalAreaStart: {
      type: Number,
      required: true,
      min: 0,
    },
    totalAreaEnd: {
      type: Number,
      required: true,
      min: 0,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: true }
);

// --- Main Property Schema ---
const PropertySchema = new mongoose.Schema(
  {
    // --- Property Images (Array) ---
    images: {
      type: [String],
      required: true,
      validate: {
        validator: function (v) {
          return v && v.length > 0;
        },
        message: "At least one image is required",
      },
    },

    // --- Basic Information ---
    title: {
      type: String,
      required: true,
      trim: true,
    },

    // --- NEW: Property Type ---
    propertyType: {
      type: String,
      required: true,
      trim: true,
      // Examples: "Apartment", "Villa", "Townhouse", "Penthouse", "Studio"
    },

    // --- NEW: City ---
    city: {
      type: String,
      required: true,
      trim: true,
      // Examples: "Dubai", "Abu Dhabi", "Sharjah", "Ajman"
    },

    location: {
      type: String,
      required: true,
      trim: true,
      // Specific location/area within the city
    },

    // --- NEW: Property Status ---
    propertyStatus: {
      type: String,
      required: true,
      enum: ["Rent", "Buy", "Off-Plan"],
    },

    startingPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    isOnHomePage: {
      type: Boolean,
      default: false,
    },
    // --- Property Details ---
    bhkCount: {
      type: Number,
      required: true,
      min: 0,
    },

    bathCount: {
      type: Number,
      required: true,
      min: 0,
    },

    totalArea: {
      type: Number,
      required: true,
      min: 0,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    // --- Developer Information ---
    developer: {
      type: String,
      required: true,
      trim: true,
    },

    // --- USP (Unique Selling Points) ---
    usp: {
      type: String,
      required: true,
      trim: true,
    },

    // --- Construction Status ---
    constructionStatus: {
      type: String,
      required: true,
      enum: [
        "Off-Plan",
        "Under Construction",
        "Site Preparation Completed",
        "Nearing Completion",
        "Completed",
        "Ready to Move",
      ],
    },

    // --- Handover ---
    handover: {
      type: String,
      required: true,
      trim: true,
      // Example: "Q2 2028", "December 2025", "2026"
    },

    // --- Floors ---
    floors: {
      type: Number,
      required: true,
      min: 0,
    },

    // --- Elevation ---
    elevation: {
      type: String,
      required: true,
      trim: true,
      // Example: "G+2P+17+R"
    },

    // --- Payment Plan (Simple String) ---
    paymentPlan: {
      type: String,
      required: true,
      trim: true,
      // Example: "40% During Construction, 60% On Completion"
    },

    // --- Total Units ---
    totalUnits: {
      type: Number,
      required: true,
      min: 0,
    },

    // --- Views ---
    views: {
      type: String,
      required: true,
      trim: true,
      // Example: "Al Barari, Majan Park, Global Village"
    },

    // --- Unit Types (Array of different unit configurations) ---
    unitTypes: {
      type: [UnitTypeSchema],
      required: true,
      validate: {
        validator: function (v) {
          return v && v.length > 0;
        },
        message: "At least one unit type is required",
      },
    },

    // --- Highlights (Bullet Points Array) ---
    highlights: {
      type: [String],
      default: [],
      validate: {
        validator: function (v) {
          return v.every((item) => item.trim().length > 0);
        },
        message: "Highlight items cannot be empty",
      },
    },

    // --- Amenities (Array) ---
    amenities: {
      type: [String],
      required: true,
      validate: {
        validator: function (v) {
          return v && v.length > 0;
        },
        message: "At least one amenity is required",
      },
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  }
);

// --- Indexes for better query performance ---
PropertySchema.index({ city: 1 });
PropertySchema.index({ location: 1 });
PropertySchema.index({ propertyType: 1 });
PropertySchema.index({ propertyStatus: 1 });
PropertySchema.index({ startingPrice: 1 });
PropertySchema.index({ developer: 1 });
PropertySchema.index({ bhkCount: 1 });
PropertySchema.index({ constructionStatus: 1 });


const Property =
  mongoose.models.Property || mongoose.model("Property", PropertySchema);

export default Property;
