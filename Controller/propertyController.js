// Controller/propertyController.js
import Property from "../models/propertyModel.js";
import cloudinary from "../config/cloudinary.js";

// @desc   Create a new property
// @route  POST /api/properties/create
export const createProperty = async (req, res) => {
  try {
    const {
      title,
      propertyType,
      city,
      location,
      propertyStatus,
      startingPrice,
      bhkCount,
      bathCount,
      totalArea,
      description,
      developer,
      usp,
      constructionStatus,
      handover,
      floors,
      elevation,
      paymentPlan,
      totalUnits,
      views,
      unitTypes,
      highlights,
      amenities,
    } = req.body;

    // Handle multiple image uploads
    const images = req.files
      ? [...new Set(req.files.map((file) => file.path))] // remove duplicates
      : [];

    if (images.length === 0) {
      return res.status(400).json({
        message: "At least one image is required",
      });
    }

    const property = new Property({
      images,
      title: title?.trim(),
      propertyType: propertyType?.trim(),
      city: city?.trim(),
      location: location?.trim(),
      propertyStatus: propertyStatus?.trim(), // TRIM HERE
      startingPrice,
      bhkCount,
      bathCount,
      totalArea,
      description: description?.trim(),
      developer: developer?.trim(),
      usp: usp?.trim(),
      constructionStatus: constructionStatus?.trim(), // TRIM HERE
      handover: handover?.trim(),
      floors,
      elevation: elevation?.trim(),
      paymentPlan: paymentPlan?.trim(),
      totalUnits,
      views: views?.trim(),
      unitTypes: unitTypes ? JSON.parse(unitTypes) : [],
      highlights: highlights ? JSON.parse(highlights) : [],
      amenities: amenities ? JSON.parse(amenities) : [],
    });

    const savedProperty = await property.save();

    res.status(201).json({
      message: "Property created successfully",
      property: savedProperty,
    });
  } catch (error) {
    console.error("Error creating property:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// @desc   Get all properties with enhanced filters
// @route  GET /api/properties
export const getProperties = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      city,
      location,
      propertyType,
      propertyStatus,
      minPrice,
      maxPrice,
      bhkCount,
      constructionStatus,
    } = req.query;

    const query = {};

    if (city) query.city = new RegExp(city.trim(), "i");
    if (location) query.location = new RegExp(location.trim(), "i");
    if (propertyType) query.propertyType = new RegExp(propertyType.trim(), "i");
    if (propertyStatus) query.propertyStatus = propertyStatus.trim();
    if (minPrice || maxPrice) {
      query.startingPrice = {};
      if (minPrice) query.startingPrice.$gte = Number(minPrice);
      if (maxPrice) query.startingPrice.$lte = Number(maxPrice);
    }
    if (bhkCount) query.bhkCount = Number(bhkCount);
    if (constructionStatus)
      query.constructionStatus = constructionStatus.trim();

    const properties = await Property.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Property.countDocuments(query);

    res.json({
      properties,
      totalPages: Math.ceil(count / limit),
      currentPage: Number(page),
      total: count,
    });
  } catch (error) {
    console.error("Error fetching properties:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc   Get single property by ID
// @route  GET /api/properties/:id
export const getPropertyById = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }
    res.json(property);
  } catch (error) {
    console.error("Error fetching property:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc   Update property (Add new images without removing old ones)
// @route  PUT /api/properties/:id
export const updateProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    // Update fields from req.body with trimming
    Object.keys(req.body).forEach((key) => {
      if (req.body[key] !== undefined && key !== "_id") {
        // Parse JSON strings for arrays and objects
        if (
          key === "unitTypes" ||
          key === "highlights" ||
          key === "amenities"
        ) {
          property[key] =
            typeof req.body[key] === "string"
              ? JSON.parse(req.body[key])
              : req.body[key];
        } else if (typeof req.body[key] === "string") {
          // Trim string values
          property[key] = req.body[key].trim();
        } else {
          property[key] = req.body[key];
        }
      }
    });

    // **FIX: ADD new images to existing images (not replace)**
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map((file) => file.path);

      // Option 1: Add new images to the END
      property.images = [...property.images, ...newImages];

      // Option 2: Add new images to the START (uncomment if you prefer)
      // property.images = [...newImages, ...property.images];
    }

    const updatedProperty = await property.save();

    res.json({
      message: "Property updated successfully",
      property: updatedProperty,
      addedImagesCount: req.files ? req.files.length : 0,
    });
  } catch (error) {
    console.error("Error updating property:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// @desc   Delete property
// @route  DELETE /api/properties/:id
export const deleteProperty = async (req, res) => {
  try {
    const property = await Property.findByIdAndDelete(req.params.id);
    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }
    res.json({ message: "Property deleted successfully" });
  } catch (error) {
    console.error("Error deleting property:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc   Delete a single image from property
// @route  DELETE /api/properties/:id/image
// @access Admin
export const deletePropertyImage = async (req, res) => {
  try {
    const { id } = req.params; // Property ID
    const { imageUrl } = req.body; // Image URL to delete

    // Validate inputs
    if (!imageUrl) {
      return res.status(400).json({
        message: "Image URL is required",
      });
    }

    // Find the property
    const property = await Property.findById(id);
    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    // Check if image exists in property
    if (!property.images.includes(imageUrl)) {
      return res.status(404).json({
        message: "Image not found in this property",
      });
    }

    // Check if this is the last image (at least 1 must remain)
    if (property.images.length === 1) {
      return res.status(400).json({
        message:
          "Cannot delete the last image. Property must have at least one image.",
      });
    }

    // STEP 1: Delete from Cloudinary
    try {
      const publicId = getPublicIdFromUrl(imageUrl);
      if (publicId) {
        await cloudinary.uploader.destroy(publicId);
        console.log(`✅ Deleted from Cloudinary: ${publicId}`);
      }
    } catch (cloudinaryError) {
      console.error("Cloudinary deletion failed:", cloudinaryError);
      // Continue to database deletion even if Cloudinary fails
    }

    // STEP 2: Remove from database
    property.images = property.images.filter((img) => img !== imageUrl);
    await property.save();

    res.json({
      message: "Image deleted successfully",
      remainingImages: property.images,
      deletedImage: imageUrl,
    });
  } catch (error) {
    console.error("Error deleting image:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// Helper function to extract public_id from Cloudinary URL
const getPublicIdFromUrl = (url) => {
  // Example: "https://res.cloudinary.com/demo/image/upload/v1234567/folder/image.jpg"
  const parts = url.split("/");
  const uploadIndex = parts.indexOf("upload");
  if (uploadIndex === -1) return null;

  const publicIdWithExtension = parts.slice(uploadIndex + 2).join("/");
  const publicId = publicIdWithExtension.substring(
    0,
    publicIdWithExtension.lastIndexOf(".")
  );
  return publicId;
};
