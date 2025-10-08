// controllers/blundersLeadController.js
import BlundersLead from "../models/blundersLeadModel.js";

// @desc   Submit blunders lead
// @route  POST /api/blunders-leads/submit
export const submitBlundersLead = async (req, res) => {
  try {
    const { name, email } = req.body;
    console.log("api call for bundelers");
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const lead = new BlundersLead({
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
    console.error("Error submitting blunders lead:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

// @desc   Get all blunders leads
// @route  GET /api/blunders-leads/all
export const getAllBlundersLeads = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const leads = await BlundersLead.find()
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await BlundersLead.countDocuments();

    res.json({
      success: true,
      leads,
      totalPages: Math.ceil(count / limit),
      currentPage: Number(page),
      total: count,
    });
  } catch (error) {
    console.error("Error fetching blunders leads:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};
