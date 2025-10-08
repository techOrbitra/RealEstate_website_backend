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
      isOnHomePage: "false",
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
      limit = 12,
      city,
      location,
      propertyType,
      propertyStatus,
      minPrice,
      maxPrice,
      bhkCount,
      constructionStatus,
      amenities, // ✅ Added amenities filter
    } = req.query;

    const query = {};

    // All filters are case-insensitive
    if (city) query.city = new RegExp(city.trim(), "i");
    if (location) query.location = new RegExp(location.trim(), "i");
    if (propertyType) query.propertyType = new RegExp(propertyType.trim(), "i");
    if (propertyStatus)
      query.propertyStatus = new RegExp(`^${propertyStatus.trim()}$`, "i");
    if (minPrice || maxPrice) {
      query.startingPrice = {};
      if (minPrice) query.startingPrice.$gte = Number(minPrice);
      if (maxPrice) query.startingPrice.$lte = Number(maxPrice);
    }
    if (bhkCount) query.bhkCount = Number(bhkCount);
    if (constructionStatus)
      query.constructionStatus = new RegExp(
        `^${constructionStatus.trim()}$`,
        "i"
      );

    // ✅ FIXED: Amenities filter with case-insensitive partial matching
    if (amenities) {
      // Parse amenities if it's a JSON string
      let amenitiesArray = amenities;
      if (typeof amenities === "string") {
        try {
          amenitiesArray = JSON.parse(amenities);
        } catch (e) {
          amenitiesArray = [amenities];
        }
      }

      if (Array.isArray(amenitiesArray) && amenitiesArray.length > 0) {
        const amenityRegexes = amenitiesArray.map(
          (amenity) => new RegExp(amenity.trim(), "i")
        );

        query.$and = amenityRegexes.map((regex) => ({
          amenities: { $elemMatch: { $regex: regex } },
        }));

        console.log(`🔍 Filtering by amenities: ${amenitiesArray.join(", ")}`);
      }
    }

    console.log("🔍 Query filters:", query);

    // Fetch properties
    const properties = await Property.find(query)
      .select({
        images: { $slice: 1 },
        propertyStatus: 1,
        propertyType: 1,
        title: 1,
        city: 1,
        location: 1,
        bhkCount: 1,
        bathCount: 1,
        totalArea: 1,
        handover: 1,
        amenities: { $slice: 5 },
        startingPrice: 1,
      })
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    console.log("🔍 Found properties:", properties.length);

    // Transform data
    const transformedProperties = properties.map((property) => ({
      _id: property._id,
      image: property.images?.[0] || null,
      propertyStatus: property.propertyStatus,
      propertyType: property.propertyType,
      title: property.title,
      city: property.city,
      location: property.location,
      bhkCount: property.bhkCount,
      bathCount: property.bathCount,
      totalArea: property.totalArea,
      handover: property.handover,
      amenities: property.amenities || [],
      startingPrice: property.startingPrice,
    }));

    const count = await Property.countDocuments(query);

    res.status(200).json({
      success: true,
      properties: transformedProperties,
      totalPages: Math.ceil(count / limit),
      currentPage: Number(page),
      total: count,
    });
  } catch (error) {
    console.error("Error fetching properties:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
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
// @access Private/Admin
export const deleteProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found",
      });
    }

    // Extract all public_ids and delete from Cloudinary
    if (property.images && property.images.length > 0) {
      const publicIds = property.images
        .map((imageUrl) => getPublicIdFromUrl(imageUrl))
        .filter((id) => id !== null);

      if (publicIds.length > 0) {
        try {
          // Delete multiple images at once
          const result = await cloudinary.api.delete_resources(publicIds, {
            resource_type: "image",
          });

          console.log(`Deleted ${publicIds.length} images from Cloudinary`);
        } catch (error) {
          console.error(
            "Error deleting images from Cloudinary:",
            error.message
          );
        }
      }
    }

    // Delete property from database
    await Property.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Property and all associated images deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting property:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
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

// @desc   Add property to homepage
// @route  PUT /api/properties/:id/add-to-homepage
// @access Private/Admin
export const addToHomePage = async (req, res) => {
  try {
    const propertyId = req.params.id;

    // Check if property exists
    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found",
      });
    }

    // Check if property is already on homepage
    if (property.isOnHomePage) {
      return res.status(400).json({
        success: false,
        message: "Property is already on the homepage",
      });
    }

    // Count current homepage properties
    const homePageCount = await Property.countDocuments({ isOnHomePage: true });

    // Check if limit is reached (maximum 8)
    if (homePageCount >= 8) {
      return res.status(400).json({
        success: false,
        message:
          "Homepage limit reached. Maximum 8 properties allowed. Please remove a property first.",
      });
    }

    // Update property to add to homepage
    property.isOnHomePage = true;
    await property.save();

    res.status(200).json({
      success: true,
      message: "Property added to homepage successfully",
      property: {
        _id: property._id,
        title: property.title,
        isOnHomePage: property.isOnHomePage,
      },
    });
  } catch (error) {
    console.error("Error adding property to homepage:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

// @desc   Remove property from homepage
// @route  PUT /api/properties/:id/remove-from-homepage
// @access Private/Admin
export const removeFromHomePage = async (req, res) => {
  try {
    const propertyId = req.params.id;

    // Check if property exists
    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found",
      });
    }

    // Check if property is on homepage
    if (!property.isOnHomePage) {
      return res.status(400).json({
        success: false,
        message: "Property is not on the homepage",
      });
    }

    // Update property to remove from homepage
    property.isOnHomePage = false;
    await property.save();

    res.status(200).json({
      success: true,
      message: "Property removed from homepage successfully",
      property: {
        _id: property._id,
        title: property.title,
        isOnHomePage: property.isOnHomePage,
      },
    });
  } catch (error) {
    console.error("Error removing property from homepage:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};
// @desc   Get all homepage properties
// @route  GET /api/properties/homepage
// @access Public
export const getHomePageProperties = async (req, res) => {
  try {
    // Include 'images' in the select to access property.images
    const homePageProperties = await Property.find({ isOnHomePage: true })
      .select("images title location bhkCount totalArea handover startingPrice")
      .sort({ createdAt: -1 })
      .limit(8);

    if (homePageProperties.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No properties found for homepage",
      });
    }

    // Map through properties to add only the first image
    const propertiesWithFirstImage = homePageProperties.map((property) => ({
      _id: property._id,
      image: property.images?.[0] || null, // Get first image or null
      title: property.title,
      location: property.location,
      bhkCount: property.bhkCount,
      totalArea: property.totalArea,
      handover: property.handover,
      startingPrice: property.startingPrice,
    }));

    res.status(200).json({
      success: true,
      count: propertiesWithFirstImage.length,
      properties: propertiesWithFirstImage,
    });
  } catch (error) {
    console.error("Error fetching homepage properties:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

// @desc   Get all properties for admin (complete data)
// @route  GET /api/properties/admin/all
// @access Private/Admin
export const getAllPropertiesAdmin = async (req, res) => {
  try {
    // Fetch all properties without pagination
    const properties = await Property.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "All properties fetched successfully",
      count: properties.length,
      properties: properties,
    });
  } catch (error) {
    console.error("Error fetching all properties:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

// @desc   Search properties with all filters (Direct API call from search form)
// @route  POST /api/properties/search
// @access Public
export const searchProperties = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      tab,
      city,
      location,
      propertyType,
      price,
      developer,
      bedrooms,
      bathrooms,
      areaSize,
      amenities, // ✅ Amenities included in main search
    } = req.body;

    console.log("🔍 Search request received:", req.body);

    const query = {};

    // Property Status filter (tab)
    if (tab && tab !== "all") {
      const statusMap = {
        rent: "Rent",
        buy: "Buy",
        offplan: "Off-Plan",
      };
      query.propertyStatus = new RegExp(`^${statusMap[tab]}$`, "i");
    }

    // City filter (case-insensitive, partial match)
    if (city && city.trim()) {
      query.city = new RegExp(city.trim(), "i");
    }

    // Location filter (case-insensitive, partial match)
    if (location && location.trim()) {
      query.location = new RegExp(location.trim(), "i");
    }

    // Property Type filter (case-insensitive, exact match)
    if (propertyType && propertyType.trim()) {
      query.propertyType = new RegExp(`^${propertyType.trim()}$`, "i");
    }

    // Developer filter (case-insensitive, partial match)
    if (developer && developer.trim()) {
      query.developer = new RegExp(developer.trim(), "i");
    }

    // Price Range filter
    if (price && price !== "" && price !== "Any") {
      if (price === "above") {
        query.startingPrice = { $gte: 5000000 };
      } else {
        const priceValue = Number(price);
        if (priceValue === 1000000) {
          query.startingPrice = { $gte: 100000, $lte: 1000000 };
        } else if (priceValue === 2000000) {
          query.startingPrice = { $gte: 1000000, $lte: 2000000 };
        } else if (priceValue === 3000000) {
          query.startingPrice = { $gte: 2000000, $lte: 3000000 };
        } else if (priceValue === 4000000) {
          query.startingPrice = { $gte: 3000000, $lte: 4000000 };
        } else if (priceValue === 5000000) {
          query.startingPrice = { $gte: 4000000, $lte: 5000000 };
        }
      }
    }

    // Bedrooms filter (exact match)
    if (bedrooms && bedrooms.trim()) {
      const bhkMatch = bedrooms.match(/(\d+)/);
      if (bhkMatch) {
        query.bhkCount = Number(bhkMatch[1]);
      }
    }

    // Bathrooms filter (exact match)
    if (bathrooms && bathrooms.trim()) {
      const bathMatch = bathrooms.match(/(\d+)/);
      if (bathMatch) {
        query.bathCount = Number(bathMatch[1]);
      }
    }

    // Area Size filter (minimum area)
    if (areaSize && areaSize.trim()) {
      const areaSizeNum = Number(areaSize);
      if (!isNaN(areaSizeNum) && areaSizeNum > 0) {
        query.totalArea = { $gte: areaSizeNum };
      }
    }

    // ✅ Amenities filter (property must have ALL selected amenities)
    if (amenities && Array.isArray(amenities) && amenities.length > 0) {
      query.amenities = { $all: amenities };
      console.log(`🔍 Filtering by amenities: ${amenities.join(", ")}`);
    }

    console.log("🔍 Final query:", JSON.stringify(query, null, 2));

    // Fetch properties
    const properties = await Property.find(query)
      .select({
        images: { $slice: 1 },
        propertyStatus: 1,
        propertyType: 1,
        title: 1,
        city: 1,
        location: 1,
        bhkCount: 1,
        bathCount: 1,
        totalArea: 1,
        handover: 1,
        amenities: { $slice: 5 },
        startingPrice: 1,
      })
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    console.log(`✅ Found ${properties.length} properties`);

    // Transform data
    const transformedProperties = properties.map((property) => ({
      _id: property._id,
      image: property.images?.[0] || null,
      propertyStatus: property.propertyStatus,
      propertyType: property.propertyType,
      title: property.title,
      city: property.city,
      location: property.location,
      bhkCount: property.bhkCount,
      bathCount: property.bathCount,
      totalArea: property.totalArea,
      handover: property.handover,
      amenities: property.amenities || [],
      startingPrice: property.startingPrice,
    }));

    const count = await Property.countDocuments(query);

    res.status(200).json({
      success: true,
      properties: transformedProperties,
      totalPages: Math.ceil(count / limit),
      currentPage: Number(page),
      total: count,
    });
  } catch (error) {
    console.error("❌ Error searching properties:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};
