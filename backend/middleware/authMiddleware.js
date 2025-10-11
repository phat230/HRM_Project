const jwt = require("jsonwebtoken");
const User = require("../models/User");

module.exports = (roles = []) => {
  return async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Không có token" });
      }

      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Tìm user trong DB
      const user = await User.findById(decoded.id);
      if (!user) {
        return res.status(401).json({ error: "User không tồn tại" });
      }

      req.user = user; // Gắn user đầy đủ vào request

      // Kiểm tra role nếu có truyền vào middleware
      if (roles.length && !roles.includes(user.role)) {
        return res.status(403).json({ error: "Không có quyền truy cập" });
      }

      next();
    } catch (err) {
      console.error("❌ Auth error:", err.message);
      res.status(401).json({ error: "Token không hợp lệ" });
    }
  };
};
