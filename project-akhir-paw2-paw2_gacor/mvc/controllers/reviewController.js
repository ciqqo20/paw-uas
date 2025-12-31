const mongoose = require("mongoose");
const Review = require("../models/review");
const Recipe = require("../models/recipe");

// Get all reviews (global)
exports.getAllReviews = async (req, res) => {
  try {
    const reviews = await Review.find()
      .populate("user", "nama")
      .populate("resep", "nama foto")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Gagal mengambil semua review",
      error: error.message,
    });
  }
};

// Get reviews for a recipe
exports.getReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ resep: req.params.recipeId })
      .populate("user", "nama")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Gagal mengambil review",
      error: error.message,
    });
  }
};

// Add review
exports.addReview = async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.recipeId);

    if (!recipe) {
      return res.status(404).json({
        success: false,
        message: "Resep tidak ditemukan",
      });
    }

    // Check if user already reviewed
    const existingReview = await Review.findOne({
      resep: req.params.recipeId,
      user: req.user.id,
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: "Anda sudah memberikan review untuk resep ini",
      });
    }

    const review = await Review.create({
      resep: req.params.recipeId,
      user: req.user.id,
      rating: req.body.rating,
      komentar: req.body.komentar,
    });

    res.status(201).json({
      success: true,
      message: "Review berhasil ditambahkan",
      data: review,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Gagal menambahkan review",
      error: error.message,
    });
  }
};

// Delete review (Owner atau Admin)
exports.deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review tidak ditemukan",
      });
    }

    // Check ownership
    if (review.user.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Anda tidak memiliki akses untuk menghapus review ini",
      });
    }

    await review.deleteOne();

    res.status(200).json({
      success: true,
      message: "Review berhasil dihapus",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Gagal menghapus review",
      error: error.message,
    });
  }
};
