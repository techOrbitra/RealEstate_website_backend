import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js"; // ✅ Import DB connection
import BlogRoutes from "./routes/blogRoutes.js";
import propertyRoutes from "./routes/propertyRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";

dotenv.config();
connectDB();

const app = express();

// Middleware
app.use(
  cors({
    origin: ["http://localhost:5173"], // ✅ allow frontend
    credentials: true,
  })
);
app.use(express.json());

// Routes
app.use("/api/blogs", BlogRoutes); // ✅ better naming
app.use("/api/properties", propertyRoutes);
// Routes
app.use("/api/contacts", contactRoutes);

// Test route
app.get("/", (req, res) => {
  res.send("Backend running ✅");
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
