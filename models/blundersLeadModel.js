// models/blundersLeadModel.js
import mongoose from "mongoose";

const BlundersLeadSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      default: "",
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
  },
  { timestamps: true }
);

BlundersLeadSchema.index({ email: 1 });
BlundersLeadSchema.index({ createdAt: -1 });

const BlundersLead = mongoose.model("BlundersLead", BlundersLeadSchema);

export default BlundersLead;
