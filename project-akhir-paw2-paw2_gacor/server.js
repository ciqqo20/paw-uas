require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./mvc/models/db");
const authRoutes = require("./mvc/routes/authRoutes");
const recipeRoutes = require("./mvc/routes/recipeRoute");
const reviewRoutes = require("./mvc/routes/reviewRoutes");

const app = express();
const PORT = process.env.PORT;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/recipes", recipeRoutes);
app.use("/api/reviews", reviewRoutes);

// Root route
app.get("/", (req, res) => {
  res.json({
    message: "Resep Masakan API dengan Auth & Review",
    endpoints: {
      auth: {
        "POST /api/auth/register": "Register user baru",
        "POST /api/auth/login": "Login user",
        "GET /api/auth/me": "Get user profile (protected)",
      },
      recipes: {
        "GET /api/recipes": "Get all recipes (public)",
        "GET /api/recipes/:id": "Get single recipe (public)",
        "GET /api/recipes/my-recipes": "Get my recipes (protected)",
        "POST /api/recipes":
          "Create recipe dengan foto (protected, multipart/form-data)",
        "PUT /api/recipes/:id":
          "Update recipe (owner/admin, multipart/form-data)",
        "DELETE /api/recipes/:id": "Delete recipe (owner/admin)",
        "GET /api/recipes/:recipeId/reviews": "Get reviews for recipe (public)",
        "POST /api/recipes/:recipeId/reviews":
          "Add review for recipe (protected)",
      },
      reviews: {
        "GET /api/reviews": "Get all reviews (public)",
        "DELETE /api/reviews/:id": "Delete review (owner/admin)",
      },
    },
  });
});

// ======= TAMBAHKAN ERROR HANDLER INI =======
// Global error handler
app.use((err, req, res, next) => {
  console.error("=== ERROR CAUGHT ===");
  console.error("Error message:", err.message);
  console.error("Error stack:", err.stack);

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal server error",
    error: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
  res.json({
    message: err.message,
    error: req.app.get("env") === "development" ? err : {},
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
