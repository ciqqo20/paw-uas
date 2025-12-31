require("dotenv").config();
const connectDB = require("./db");
const User = require("./user");
const mongoose = require("mongoose");

const seedAdmin = async () => {
  try {
    await connectDB();

    const adminEmail = "admin@admin.com";
    const adminPassword = "password123";

    const adminExists = await User.findOne({ email: adminEmail });

    if (adminExists) {
    } else {
      await User.create({
        nama: "Super Admin",
        email: adminEmail,
        password: adminPassword,
        role: "admin",
      });
    }
  } catch (error) {
    console.error("❌ Error seeding admin:", error);
  } finally {
    await mongoose.connection.close();
    process.exit();
  }
};

seedAdmin();
