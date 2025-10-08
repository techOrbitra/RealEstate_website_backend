// controllers/newsletterController.js
import Newsletter from "../models/newsletterModel.js";

// @desc   Subscribe to newsletter
// @route  POST /api/newsletter/subscribe
// @access Public
export const subscribeNewsletter = async (req, res) => {
  try {
    const { email, source = "footer" } = req.body;

    // Validate email
    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    // Check if email already exists
    const existingSubscription = await Newsletter.findOne({
      email: email.toLowerCase().trim(),
    });

    if (existingSubscription) {
      // If already subscribed and active
      if (existingSubscription.isActive) {
        return res.status(200).json({
          success: true,
          message: "You are already subscribed to our newsletter!",
          alreadySubscribed: true,
        });
      }

      // If previously unsubscribed, reactivate
      existingSubscription.isActive = true;
      existingSubscription.subscribedAt = Date.now();
      await existingSubscription.save();

      return res.status(200).json({
        success: true,
        message: "Welcome back! Your subscription has been reactivated.",
        subscription: existingSubscription,
      });
    }

    // Get IP address (optional)
    const ipAddress =
      req.headers["x-forwarded-for"] || req.connection.remoteAddress;

    // Create new subscription
    const newSubscription = new Newsletter({
      email: email.toLowerCase().trim(),
      source,
      ipAddress,
    });

    await newSubscription.save();

    res.status(201).json({
      success: true,
      message: "Thank you for subscribing! You'll receive updates soon.",
      subscription: newSubscription,
    });
  } catch (error) {
    console.error("Newsletter subscription error:", error);

    // Handle validation errors
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Invalid email address",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to subscribe. Please try again later.",
      error: error.message,
    });
  }
};

// @desc   Unsubscribe from newsletter
// @route  POST /api/newsletter/unsubscribe
// @access Public
export const unsubscribeNewsletter = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const subscription = await Newsletter.findOne({
      email: email.toLowerCase().trim(),
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "Email not found in our subscription list",
      });
    }

    if (!subscription.isActive) {
      return res.status(200).json({
        success: true,
        message: "You are already unsubscribed",
      });
    }

    subscription.isActive = false;
    await subscription.save();

    res.status(200).json({
      success: true,
      message: "You have been successfully unsubscribed",
    });
  } catch (error) {
    console.error("Newsletter unsubscribe error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to unsubscribe. Please try again later.",
      error: error.message,
    });
  }
};

// @desc   Get all newsletter subscriptions (Admin only)
// @route  GET /api/newsletter/subscribers
// @access Private/Admin
export const getAllSubscribers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      isActive,
      sortBy = "createdAt",
      order = "desc",
    } = req.query;

    const query = {};
    if (isActive !== undefined) {
      query.isActive = isActive === "true";
    }

    const subscribers = await Newsletter.find(query)
      .select("email subscribedAt isActive source")
      .sort({ [sortBy]: order === "desc" ? -1 : 1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await Newsletter.countDocuments(query);
    const activeCount = await Newsletter.countDocuments({ isActive: true });

    res.status(200).json({
      success: true,
      subscribers,
      pagination: {
        total,
        activeCount,
        page: Number(page),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get subscribers error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch subscribers",
      error: error.message,
    });
  }
};

// @desc   Delete subscriber (Admin only)
// @route  DELETE /api/newsletter/:id
// @access Private/Admin
export const deleteSubscriber = async (req, res) => {
  try {
    const { id } = req.params;

    const subscriber = await Newsletter.findByIdAndDelete(id);

    if (!subscriber) {
      return res.status(404).json({
        success: false,
        message: "Subscriber not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Subscriber deleted successfully",
    });
  } catch (error) {
    console.error("Delete subscriber error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete subscriber",
      error: error.message,
    });
  }
};

// @desc   Get newsletter statistics (Admin only)
// @route  GET /api/newsletter/stats
// @access Private/Admin
export const getNewsletterStats = async (req, res) => {
  try {
    const totalSubscribers = await Newsletter.countDocuments();
    const activeSubscribers = await Newsletter.countDocuments({
      isActive: true,
    });
    const inactiveSubscribers = await Newsletter.countDocuments({
      isActive: false,
    });

    // Get subscribers by source
    const bySource = await Newsletter.aggregate([
      {
        $group: {
          _id: "$source",
          count: { $sum: 1 },
        },
      },
    ]);

    // Get recent subscriptions (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentSubscriptions = await Newsletter.countDocuments({
      subscribedAt: { $gte: thirtyDaysAgo },
    });

    res.status(200).json({
      success: true,
      stats: {
        total: totalSubscribers,
        active: activeSubscribers,
        inactive: inactiveSubscribers,
        bySource,
        recentSubscriptions,
      },
    });
  } catch (error) {
    console.error("Get newsletter stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch newsletter statistics",
      error: error.message,
    });
  }
};
