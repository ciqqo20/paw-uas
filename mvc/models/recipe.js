const mongoose = require("mongoose");

const recipeSchema = new mongoose.Schema(
  {
    nama: {
      type: String,
      required: [true, "Nama resep wajib diisi"],
      trim: true,
    },
    foto: {
      type: String,
      required: [true, "Foto resep wajib diisi"],
    },
    cloudinary_id: {
      type: String,
    },
    bahan: {
      type: [String],
      required: [true, "Bahan-bahan wajib diisi"],
    },
    langkah: {
      type: [String],
      required: [true, "Langkah-langkah wajib diisi"],
    },
    waktuMasak: {
      type: Number,
      required: [true, "Waktu masak wajib diisi"],
    },
    porsi: {
      type: Number,
      required: [true, "Jumlah porsi wajib diisi"],
    },
    kategori: {
      type: String,
      enum: ["pembuka", "utama", "penutup", "minuman", "snack"],
      default: "utama",
    },
    tingkatKesulitan: {
      type: String,
      enum: ["mudah", "sedang", "sulit"],
      default: "sedang",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    averageRating: {
      type: Number,
      default: 0,
    },
    totalReviews: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Recipe", recipeSchema);
