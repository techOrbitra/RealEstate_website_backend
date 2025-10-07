// uploadProperty.js - COMPLETE UPLOADER
import fs from "fs-extra";
import path from "path";
import axios from "axios";
import FormData from "form-data";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const API_URL = process.env.API_URL || "http://localhost:3000";
const CURRENT_PROPERTY_DIR = path.join(__dirname, "current_property");
const IMAGES_DIR = path.join(CURRENT_PROPERTY_DIR, "images");
const DETAILS_FILE = path.join(CURRENT_PROPERTY_DIR, "details.json");
const UPLOADED_DIR = path.join(__dirname, "uploaded_properties");

// Supported image formats
const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".gif"];

// ========================================
// HELPER FUNCTIONS
// ========================================

function validateDirectoryStructure() {
  console.log("🔍 Validating directory structure...\n");

  // Check current_property folder
  if (!fs.existsSync(CURRENT_PROPERTY_DIR)) {
    console.log('❌ Error: "current_property" folder not found!');
    console.log("   Creating folder structure...\n");
    fs.ensureDirSync(IMAGES_DIR);
    console.log("✅ Created: current_property/images/");
    console.log("   Please add your property images to this folder.\n");
    return false;
  }

  // Check images folder
  if (!fs.existsSync(IMAGES_DIR)) {
    console.log('❌ Error: "current_property/images" folder not found!');
    console.log("   Creating images folder...\n");
    fs.ensureDirSync(IMAGES_DIR);
    console.log("✅ Created: current_property/images/");
    console.log("   Please add your property images to this folder.\n");
    return false;
  }

  // Check details.json
  if (!fs.existsSync(DETAILS_FILE)) {
    console.log('❌ Error: "current_property/details.json" not found!');
    console.log("   Please create details.json with property information.\n");
    return false;
  }

  return true;
}

function getImageFiles() {
  console.log("📸 Scanning for images...\n");

  try {
    const files = fs.readdirSync(IMAGES_DIR);
    const imageFiles = files.filter((file) => {
      const ext = path.extname(file).toLowerCase();
      return IMAGE_EXTENSIONS.includes(ext);
    });

    if (imageFiles.length === 0) {
      console.log("❌ No images found in current_property/images/");
      console.log("   Supported formats: .jpg, .jpeg, .png, .webp, .gif\n");
      return [];
    }

    console.log(`✅ Found ${imageFiles.length} images:\n`);
    imageFiles.forEach((file, index) => {
      const filePath = path.join(IMAGES_DIR, file);
      const stats = fs.statSync(filePath);
      const sizeKB = (stats.size / 1024).toFixed(2);
      console.log(`   ${index + 1}. ${file} (${sizeKB} KB)`);
    });
    console.log();

    return imageFiles.map((file) => path.join(IMAGES_DIR, file));
  } catch (error) {
    console.log(`❌ Error reading images: ${error.message}\n`);
    return [];
  }
}

function loadPropertyDetails() {
  console.log("📄 Loading property details...\n");

  try {
    const detailsContent = fs.readFileSync(DETAILS_FILE, "utf-8");
    const details = JSON.parse(detailsContent);

    // Validate required fields
    const requiredFields = [
      "title",
      "propertyType",
      "city",
      "location",
      "propertyStatus",
      "startingPrice",
      "bhkCount",
      "bathCount",
      "totalArea",
      "description",
      "developer",
      "usp",
      "constructionStatus",
      "handover",
      "floors",
      "elevation",
      "paymentPlan",
      "totalUnits",
      "views",
      "unitTypes",
      "amenities",
    ];

    const missingFields = requiredFields.filter((field) => !details[field]);

    if (missingFields.length > 0) {
      console.log("❌ Missing required fields in details.json:");
      missingFields.forEach((field) => console.log(`   - ${field}`));
      console.log();
      return null;
    }

    console.log("✅ Property details loaded successfully!");
    console.log(`   Title: ${details.title}`);
    console.log(`   Type: ${details.propertyType}`);
    console.log(`   Location: ${details.city}, ${details.location}`);
    console.log(`   Price: AED ${details.startingPrice.toLocaleString()}\n`);

    return details;
  } catch (error) {
    console.log(`❌ Error loading details.json: ${error.message}\n`);
    return null;
  }
}

async function uploadProperty(imagePaths, propertyDetails) {
  console.log("🚀 Uploading property to backend...\n");

  try {
    // Create form data
    const formData = new FormData();

    // Add all images
    console.log("📤 Preparing images for upload...\n");
    for (let i = 0; i < imagePaths.length; i++) {
      const imagePath = imagePaths[i];
      const imageStream = fs.createReadStream(imagePath);
      const filename = path.basename(imagePath);
      formData.append("images", imageStream, filename);
      console.log(`   ${i + 1}. ${filename}`);
    }
    console.log();

    // Add property details
    console.log("📝 Adding property details...\n");

    // Convert arrays and objects to JSON strings
    formData.append("title", propertyDetails.title);
    formData.append("propertyType", propertyDetails.propertyType);
    formData.append("city", propertyDetails.city);
    formData.append("location", propertyDetails.location);
    formData.append("propertyStatus", propertyDetails.propertyStatus);
    formData.append("startingPrice", propertyDetails.startingPrice.toString());
    formData.append("bhkCount", propertyDetails.bhkCount.toString());
    formData.append("bathCount", propertyDetails.bathCount.toString());
    formData.append("totalArea", propertyDetails.totalArea.toString());
    formData.append("description", propertyDetails.description);
    formData.append("developer", propertyDetails.developer);
    formData.append("usp", propertyDetails.usp);
    formData.append("constructionStatus", propertyDetails.constructionStatus);
    formData.append("handover", propertyDetails.handover);
    formData.append("floors", propertyDetails.floors.toString());
    formData.append("elevation", propertyDetails.elevation);
    formData.append("paymentPlan", propertyDetails.paymentPlan);
    formData.append("totalUnits", propertyDetails.totalUnits.toString());
    formData.append("views", propertyDetails.views);

    // Arrays as JSON strings
    formData.append("unitTypes", JSON.stringify(propertyDetails.unitTypes));
    formData.append(
      "highlights",
      JSON.stringify(propertyDetails.highlights || [])
    );
    formData.append("amenities", JSON.stringify(propertyDetails.amenities));

    // Make API request
    console.log(`🌐 Sending request to: ${API_URL}/api/properties/create\n`);

    const response = await axios.post(
      `${API_URL}/api/properties/create`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        timeout: 120000, // 2 minutes
      }
    );

    if (response.status === 201 || response.status === 200) {
      console.log("✅ Property uploaded successfully!\n");
      console.log("Response:");
      console.log(JSON.stringify(response.data, null, 2));
      console.log();
      return response.data;
    } else {
      console.log(`⚠️  Unexpected status code: ${response.status}\n`);
      return null;
    }
  } catch (error) {
    console.log("❌ Upload failed!\n");

    if (error.response) {
      console.log(`Status: ${error.response.status}`);
      console.log(`Error: ${JSON.stringify(error.response.data, null, 2)}`);
    } else if (error.request) {
      console.log("No response received from server.");
      console.log("Make sure your backend is running!");
    } else {
      console.log(`Error: ${error.message}`);
    }
    console.log();

    return null;
  }
}

function archiveProperty(propertyTitle) {
  console.log("📦 Archiving uploaded property...\n");

  try {
    // Create archive folder name
    const timestamp = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    const safeName = propertyTitle
      .replace(/[^a-zA-Z0-9]/g, "_")
      .substring(0, 50);
    const archiveName = `${safeName}_${timestamp}`;
    const archivePath = path.join(UPLOADED_DIR, archiveName);

    // Ensure uploaded directory exists
    fs.ensureDirSync(UPLOADED_DIR);

    // Copy entire current_property folder to archive
    fs.copySync(CURRENT_PROPERTY_DIR, archivePath);

    console.log(
      `✅ Property archived to: uploaded_properties/${archiveName}\n`
    );

    // Clear current_property folder
    fs.emptyDirSync(IMAGES_DIR);
    fs.removeSync(DETAILS_FILE);

    console.log("✅ Cleared current_property folder");
    console.log("   Ready for next property!\n");

    return true;
  } catch (error) {
    console.log(`⚠️  Warning: Could not archive property: ${error.message}\n`);
    return false;
  }
}

// ========================================
// MAIN EXECUTION
// ========================================

async function main() {
  console.log("\n" + "=".repeat(70));
  console.log("🏠 PROPERTY UPLOADER - Automated Upload System");
  console.log("=".repeat(70) + "\n");

  // Step 1: Validate directory structure
  if (!validateDirectoryStructure()) {
    console.log("Please fix the directory structure and try again.\n");
    process.exit(1);
  }

  // Step 2: Get image files
  const imagePaths = getImageFiles();
  if (imagePaths.length === 0) {
    console.log(
      "Please add images to current_property/images/ and try again.\n"
    );
    process.exit(1);
  }

  // Step 3: Load property details
  const propertyDetails = loadPropertyDetails();
  if (!propertyDetails) {
    console.log("Please fix details.json and try again.\n");
    process.exit(1);
  }

  // Step 4: Confirm upload
  console.log("=".repeat(70));
  console.log("📋 UPLOAD SUMMARY");
  console.log("=".repeat(70));
  console.log(`Property: ${propertyDetails.title}`);
  console.log(`Images: ${imagePaths.length} files`);
  console.log(`API URL: ${API_URL}`);
  console.log("=".repeat(70) + "\n");

  // Step 5: Upload property
  const result = await uploadProperty(imagePaths, propertyDetails);

  if (result) {
    console.log("=".repeat(70));
    console.log("✅ UPLOAD SUCCESSFUL!");
    console.log("=".repeat(70));
    console.log(`Property ID: ${result.property?._id || "N/A"}`);
    console.log(`Title: ${result.property?.title || propertyDetails.title}`);
    console.log("=".repeat(70) + "\n");

    // Step 6: Archive property
    archiveProperty(propertyDetails.title);

    console.log("=".repeat(70));
    console.log("🎉 PROCESS COMPLETE!");
    console.log("=".repeat(70));
    console.log("Next steps:");
    console.log("1. Add new property images to current_property/images/");
    console.log("2. Update current_property/details.json");
    console.log("3. Run: npm run upload");
    console.log("=".repeat(70) + "\n");
  } else {
    console.log("=".repeat(70));
    console.log("❌ UPLOAD FAILED");
    console.log("=".repeat(70));
    console.log("Please check the error messages above and try again.\n");
    process.exit(1);
  }
}

// Run the script
main().catch((error) => {
  console.error("\n💥 Fatal Error:", error.message);
  process.exit(1);
});
