const express = require("express");
const router = express.Router();
const reviewController = require("../controllers/reviewController");
const { protect } = require("../middleware/auth");

router.get("/", reviewController.getAllReviews);
router.delete("/:id", protect, reviewController.deleteReview);

module.exports = router;
