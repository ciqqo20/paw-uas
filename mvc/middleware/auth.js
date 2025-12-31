const jwt = require("jsonwebtoken");
const User = require("../models/user");

// Protect routes - verifikasi JWT
exports.protect = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Tidak ada akses. Login terlebih dahulu",
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User tidak ditemukan",
      });
    }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Token tidak valid",
      error: error.message,
    });
  }
};

// Authorize roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user.role}' tidak memiliki akses ke resource ini`,
      });
    }
    next();
  };
};
