const Recipe = require("../models/recipe");
const { cloudinary, uploadToCloudinary } = require("../models/cloudinary");

// Get all recipes
exports.getAllRecipes = async (req, res) => {
  try {
    const { kategori, tingkatKesulitan, page = 1, limit = 10 } = req.query;
    let query = {};

    if (kategori) query.kategori = kategori;
    if (tingkatKesulitan) query.tingkatKesulitan = tingkatKesulitan;

    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const skip = (pageNumber - 1) * limitNumber;

    const totalItems = await Recipe.countDocuments(query);
    const totalPages = Math.ceil(totalItems / limitNumber);

    const recipes = await Recipe.find(query)
      .populate("createdBy", "nama email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNumber);

    res.status(200).json({
      success: true,
      count: recipes.length,
      pagination: {
        currentPage: pageNumber,
        totalPages: totalPages,
        totalItems: totalItems,
        limit: limitNumber,
      },
      data: recipes,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Gagal mengambil data resep",
      error: error.message,
    });
  }
};

// Get single recipe
exports.getRecipeById = async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id).populate(
      "createdBy",
      "nama email"
    );

    if (!recipe) {
      return res.status(404).json({
        success: false,
        message: "Resep tidak ditemukan",
      });
    }

    res.status(200).json({
      success: true,
      data: recipe,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Gagal mengambil data resep",
      error: error.message,
    });
  }
};

// Create recipe (User & Admin) - WITH PHOTO UPLOAD
exports.createRecipe = async (req, res) => {
  try {
    // Check if photo uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Foto resep wajib diupload",
      });
    }

    // Upload foto ke cloudinary
    const result = await uploadToCloudinary(req.file.buffer);

    // Parse bahan dan langkah jika dalam bentuk string
    let bahan = req.body.bahan;
    let langkah = req.body.langkah;

    if (typeof bahan === "string") {
      bahan = JSON.parse(bahan);
    }
    if (typeof langkah === "string") {
      langkah = JSON.parse(langkah);
    }

    const recipe = await Recipe.create({
      nama: req.body.nama,
      foto: result.secure_url, // URL dari cloudinary
      cloudinary_id: result.public_id, // Public ID untuk delete nanti
      bahan,
      langkah,
      waktuMasak: req.body.waktuMasak,
      porsi: req.body.porsi,
      kategori: req.body.kategori,
      tingkatKesulitan: req.body.tingkatKesulitan,
      createdBy: req.user.id,
    });

    res.status(201).json({
      success: true,
      message: "Resep berhasil dibuat",
      data: recipe,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Gagal membuat resep",
      error: error.message,
    });
  }
};

// Update recipe (Owner atau Admin) - WITH OPTIONAL PHOTO UPDATE
exports.updateRecipe = async (req, res) => {
  try {
    let recipe = await Recipe.findById(req.params.id);

    if (!recipe) {
      return res.status(404).json({
        success: false,
        message: "Resep tidak ditemukan",
      });
    }

    // Check ownership
    if (
      recipe.createdBy.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Anda tidak memiliki akses untuk mengupdate resep ini",
      });
    }

    // Update data
    const updateData = { ...req.body };

    // Parse array jika dalam bentuk string
    if (req.body.bahan && typeof req.body.bahan === "string") {
      updateData.bahan = JSON.parse(req.body.bahan);
    }
    if (req.body.langkah && typeof req.body.langkah === "string") {
      updateData.langkah = JSON.parse(req.body.langkah);
    }

    // Jika ada foto baru, upload dan hapus foto lama
    if (req.file) {
      // Upload foto baru
      const result = await uploadToCloudinary(req.file.buffer);

      // Hapus foto lama dari cloudinary
      if (recipe.cloudinary_id) {
        await cloudinary.uploader.destroy(recipe.cloudinary_id);
      }

      updateData.foto = result.secure_url;
      updateData.cloudinary_id = result.public_id;
    }

    recipe = await Recipe.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: "Resep berhasil diupdate",
      data: recipe,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Gagal mengupdate resep",
      error: error.message,
    });
  }
};

// Delete recipe (Owner atau Admin)
exports.deleteRecipe = async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);

    if (!recipe) {
      return res.status(404).json({
        success: false,
        message: "Resep tidak ditemukan",
      });
    }

    // Check ownership
    if (
      recipe.createdBy.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Anda tidak memiliki akses untuk menghapus resep ini",
      });
    }

    // Hapus foto dari cloudinary
    if (recipe.cloudinary_id) {
      await cloudinary.uploader.destroy(recipe.cloudinary_id);
    }

    await recipe.deleteOne();

    res.status(200).json({
      success: true,
      message: "Resep berhasil dihapus",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Gagal menghapus resep",
      error: error.message,
    });
  }
};

// Get my recipes
exports.getMyRecipes = async (req, res) => {
  try {
    const recipes = await Recipe.find({ createdBy: req.user.id }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      count: recipes.length,
      data: recipes,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Gagal mengambil data resep",
      error: error.message,
    });
  }
};
