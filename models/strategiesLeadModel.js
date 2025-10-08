// models/strategiesLeadModel.js
import mongoose from "mongoose";

const StrategiesLeadSchema = new mongoose.Schema(
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

StrategiesLeadSchema.index({ email: 1 });
StrategiesLeadSchema.index({ createdAt: -1 });

const StrategiesLead = mongoose.model("StrategiesLead", StrategiesLeadSchema);

export default StrategiesLead;
