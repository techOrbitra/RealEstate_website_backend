// controllers/callbackController.js - WITHOUT IP ADDRESS
import CallbackRequest from "../models/callbackModel.js";
import Property from "../models/propertyModel.js";

// @desc   Create a new callback request
// @route  POST /api/callbacks
// @access Public
export const createCallbackRequest = async (req, res) => {
  try {
    const {
      propertyId,
      propertyTitle,
      name,
      email,
      phone,
      message,
      preferredTime,
    } = req.body;

    // Validate required fields
    if (!propertyId || !propertyTitle || !name || !email || !phone) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields",
      });
    }

    // Verify property exists
    const propertyExists = await Property.findById(propertyId);
    if (!propertyExists) {
      return res.status(404).json({
        success: false,
        message: "Property not found",
      });
    }

    // Create callback request
    const callbackRequest = new CallbackRequest({
      propertyId,
      propertyTitle,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      message: message?.trim() || "",
      preferredTime: preferredTime || "Anytime",
    });

    await callbackRequest.save();

    res.status(201).json({
      success: true,
      message:
        "Callback request submitted successfully! We'll contact you soon.",
      callbackRequest: {
        _id: callbackRequest._id,
        propertyTitle: callbackRequest.propertyTitle,
        name: callbackRequest.name,
        email: callbackRequest.email,
        phone: callbackRequest.phone,
        status: callbackRequest.status,
        createdAt: callbackRequest.createdAt,
      },
    });
  } catch (error) {
    console.error("Create callback request error:", error);

    // Handle validation errors
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: Object.values(error.errors).map((err) => err.message),
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to submit callback request. Please try again.",
      error: error.message,
    });
  }
};

// @desc   Get all callback requests (Admin)
// @route  GET /api/callbacks
// @access Private/Admin
export const getAllCallbackRequests = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      propertyId,
      sortBy = "createdAt",
      order = "desc",
    } = req.query;

    const query = {};

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Filter by property
    if (propertyId) {
      query.propertyId = propertyId;
    }

    // Fetch callback requests
    const callbackRequests = await CallbackRequest.find(query)
      .populate("propertyId", "title location propertyType startingPrice")
      .sort({ [sortBy]: order === "desc" ? -1 : 1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await CallbackRequest.countDocuments(query);

    // Get status counts
    const statusCounts = await CallbackRequest.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      callbackRequests,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / limit),
      },
      statusCounts,
    });
  } catch (error) {
    console.error("Get callback requests error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch callback requests",
      error: error.message,
    });
  }
};

// @desc   Get single callback request (Admin)
// @route  GET /api/callbacks/:id
// @access Private/Admin
export const getCallbackRequestById = async (req, res) => {
  try {
    const { id } = req.params;

    const callbackRequest = await CallbackRequest.findById(id).populate(
      "propertyId",
      "title location propertyType startingPrice images"
    );

    if (!callbackRequest) {
      return res.status(404).json({
        success: false,
        message: "Callback request not found",
      });
    }

    res.status(200).json({
      success: true,
      callbackRequest,
    });
  } catch (error) {
    console.error("Get callback request error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch callback request",
      error: error.message,
    });
  }
};

// @desc   Update callback request status (Admin)
// @route  PUT /api/callbacks/:id
// @access Private/Admin
export const updateCallbackRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;

    const callbackRequest = await CallbackRequest.findById(id);

    if (!callbackRequest) {
      return res.status(404).json({
        success: false,
        message: "Callback request not found",
      });
    }

    // Update fields
    if (status) {
      callbackRequest.status = status;
    }
    if (adminNotes !== undefined) {
      callbackRequest.adminNotes = adminNotes;
    }

    await callbackRequest.save();

    res.status(200).json({
      success: true,
      message: "Callback request updated successfully",
      callbackRequest,
    });
  } catch (error) {
    console.error("Update callback request error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update callback request",
      error: error.message,
    });
  }
};

// @desc   Delete callback request (Admin)
// @route  DELETE /api/callbacks/:id
// @access Private/Admin
export const deleteCallbackRequest = async (req, res) => {
  try {
    const { id } = req.params;

    const callbackRequest = await CallbackRequest.findByIdAndDelete(id);

    if (!callbackRequest) {
      return res.status(404).json({
        success: false,
        message: "Callback request not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Callback request deleted successfully",
    });
  } catch (error) {
    console.error("Delete callback request error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete callback request",
      error: error.message,
    });
  }
};

// @desc   Get callback statistics (Admin)
// @route  GET /api/callbacks/stats
// @access Private/Admin
export const getCallbackStats = async (req, res) => {
  try {
    const totalRequests = await CallbackRequest.countDocuments();
    const pendingRequests = await CallbackRequest.countDocuments({
      status: "Pending",
    });
    const contactedRequests = await CallbackRequest.countDocuments({
      status: "Contacted",
    });
    const completedRequests = await CallbackRequest.countDocuments({
      status: "Completed",
    });

    // Get recent requests (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentRequests = await CallbackRequest.countDocuments({
      createdAt: { $gte: thirtyDaysAgo },
    });

    // Top properties by callback requests
    const topProperties = await CallbackRequest.aggregate([
      {
        $group: {
          _id: "$propertyId",
          count: { $sum: 1 },
          propertyTitle: { $first: "$propertyTitle" },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    res.status(200).json({
      success: true,
      stats: {
        total: totalRequests,
        pending: pendingRequests,
        contacted: contactedRequests,
        completed: completedRequests,
        recentRequests,
        topProperties,
      },
    });
  } catch (error) {
    console.error("Get callback stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch callback statistics",
      error: error.message,
    });
  }
};
