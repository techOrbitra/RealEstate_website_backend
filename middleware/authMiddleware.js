// middleware/authMiddleware.js
import jwt from "jsonwebtoken";
import Admin from "../models/AdminModel.js";

// Protect routes - verify JWT
export const protect = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorized, no token",
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your-secret-key"
    );

    req.admin = await Admin.findById(decoded.id).select("-password");

    if (!req.admin || !req.admin.isActive) {
      return res.status(401).json({
        success: false,
        message: "Not authorized, invalid token",
      });
    }

    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(401).json({
      success: false,
      message: "Not authorized, token failed",
    });
  }
};

// Super-admin only routes
export const superAdminOnly = (req, res, next) => {
  if (req.admin && req.admin.role === "super-admin") {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: "Access denied. Super-admin only.",
    });
  }
};
