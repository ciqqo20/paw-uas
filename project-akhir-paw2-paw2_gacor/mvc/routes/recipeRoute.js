const express = require("express");
const router = express.Router();
const recipeController = require("../controllers/recipeController");
const reviewController = require("../controllers/reviewController");
const { protect, authorize } = require("../middleware/auth");
const { upload } = require("../models/cloudinary");

router.get("/", recipeController.getAllRecipes);
router.get("/my-recipes", protect, recipeController.getMyRecipes);

// Review Routes mounted under recipes
router.get("/:recipeId/reviews", reviewController.getReviews);
router.post("/:recipeId/reviews", protect, reviewController.addReview);

router.get("/:id", recipeController.getRecipeById);

// Routes dengan upload foto
router.post("/", protect, upload.single("foto"), recipeController.createRecipe);
router.put(
  "/:id",
  protect,
  upload.single("foto"),
  recipeController.updateRecipe
);
router.delete("/:id", protect, recipeController.deleteRecipe);

module.exports = router;
