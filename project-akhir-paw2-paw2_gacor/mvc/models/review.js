const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    resep: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Recipe",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    rating: {
      type: Number,
      required: [true, "Rating wajib diisi"],
      min: 1,
      max: 5,
    },
    komentar: {
      type: String,
      required: [true, "Komentar wajib diisi"],
      maxlength: 500,
    },
  },
  {
    timestamps: true,
  }
);

// Satu user hanya bisa review satu resep sekali
reviewSchema.index({ resep: 1, user: 1 }, { unique: true });

// Update average rating di Recipe setelah save review
reviewSchema.statics.updateAverageRating = async function (resepId) {
  const stats = await this.aggregate([
    { $match: { resep: resepId } },
    {
      $group: {
        _id: "$resep",
        averageRating: { $avg: "$rating" },
        totalReviews: { $sum: 1 },
      },
    },
  ]);

  if (stats.length > 0) {
    await mongoose.model("Recipe").findByIdAndUpdate(resepId, {
      averageRating: stats[0].averageRating.toFixed(1),
      totalReviews: stats[0].totalReviews,
    });
  } else {
    await mongoose.model("Recipe").findByIdAndUpdate(resepId, {
      averageRating: 0,
      totalReviews: 0,
    });
  }
};

reviewSchema.post("save", function () {
  this.constructor.updateAverageRating(this.resep);
});

reviewSchema.post("deleteOne", { document: true, query: false }, function () {
  this.constructor.updateAverageRating(this.resep);
});

module.exports = mongoose.model("Review", reviewSchema);
