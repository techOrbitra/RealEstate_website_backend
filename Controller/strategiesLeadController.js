// controllers/strategiesLeadController.js
import StrategiesLead from "../models/strategiesLeadModel.js";

// @desc   Submit strategies lead
// @route  POST /api/strategies-leads/submit
export const submitStrategiesLead = async (req, res) => {
  try {
    const { name, email } = req.body;
    console.log("api call for strategies")
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const lead = new StrategiesLead({
      name: name?.trim() || "",
      email: email.trim().toLowerCase(),
    });

    await lead.save();

    res.status(201).json({
      success: true,
      message: "Lead submitted successfully",
      lead,
    });
  } catch (error) {
    console.error("Error submitting strategies lead:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

// @desc   Get all strategies leads
// @route  GET /api/strategies-leads/all
export const getAllStrategiesLeads = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const leads = await StrategiesLead.find()
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await StrategiesLead.countDocuments();

    res.json({
      success: true,
      leads,
      totalPages: Math.ceil(count / limit),
      currentPage: Number(page),
      total: count,
    });
  } catch (error) {
    console.error("Error fetching strategies leads:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};
