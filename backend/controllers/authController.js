const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Employee = require("../models/Employee");

function generateTokens(user) {
  const accessToken = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET || "secret",
    { expiresIn: "1d" }
  );
  const refreshToken = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_REFRESH_SECRET || "refresh_secret",
    { expiresIn: "7d" }
  );
  return { accessToken, refreshToken };
}

// 📌 Đăng ký
exports.register = async (req, res) => {
  try {
    const { username, password, name, department, position } = req.body;
    if (!username || !password || !name || !department || !position) {
      return res.status(400).json({ error: "Vui lòng nhập đầy đủ thông tin" });
    }

    const existing = await User.findOne({ username });
    if (existing) return res.status(400).json({ error: "Username đã tồn tại" });

    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ Role luôn là "employee"
    const newUser = new User({
      username,
      password: hashedPassword,
      role: "employee",
    });

    const savedUser = await newUser.save();

    const newEmployee = new Employee({
      userId: savedUser._id,
      name,
      department,
      position,
    });
    await newEmployee.save();

    const { accessToken, refreshToken } = generateTokens(savedUser);

    res.json({
      message: "✅ Đăng ký thành công",
      token: accessToken,
      refreshToken,
      user: {
        id: savedUser._id,
        username: savedUser.username,
        role: savedUser.role,
      },
    });
  } catch (err) {
    console.error("❌ Lỗi đăng ký:", err);
    res.status(500).json({ error: err.message });
  }
};


// 📌 Đăng nhập
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user)
      return res.status(400).json({ error: "Sai username hoặc password" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ error: "Sai username hoặc password" });

    // Sinh AccessToken & RefreshToken
    const { accessToken, refreshToken } = generateTokens(user);

    res.json({
      message: "✅ Đăng nhập thành công",
      token: accessToken,
      refreshToken,
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("❌ Lỗi đăng nhập:", err);
    res.status(500).json({ error: err.message });
  }
};

// 📌 Làm mới Access Token
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken)
      return res.status(400).json({ error: "Thiếu refresh token" });

    // Xác thực refresh token
    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET || "refresh_secret"
    );

    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ error: "User không tồn tại" });

    // Tạo Access Token mới
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);

    res.json({
      message: "🔁 Làm mới token thành công",
      token: accessToken,
      refreshToken: newRefreshToken,
    });
  } catch (err) {
    console.error("❌ Lỗi refresh token:", err);
    res.status(401).json({ error: "Refresh token không hợp lệ hoặc hết hạn" });
  }
};
