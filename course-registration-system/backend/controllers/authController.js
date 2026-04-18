const User = require('../models/User');
const generateToken = require('../utils/generateToken');

function getDisplayEmail(user) {
  return user.role === 'admin' ? 'Admin@iuh.edu.vn' : user.email;
}

exports.register = async (req, res, next) => {
  try {
    const { email, password, fullName } = req.body;
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const exist = await User.findOne({ email: normalizedEmail });
    if (exist) return res.status(409).json({ success: false, message: 'Email đã tồn tại' });
    const user = await User.create({ email: normalizedEmail, password, fullName, role: 'student' });
    res.status(201).json({ success: true, data: { id: user._id, email: getDisplayEmail(user), token: generateToken(user) } });
  } catch (err) { next(err); }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user || !(await user.comparePassword(password))) return res.status(401).json({ success: false, message: 'Sai email hoặc mật khẩu' });
    res.json({ success: true, data: { id: user._id, email: getDisplayEmail(user), token: generateToken(user) } });
  } catch (err) { next(err); }
};

exports.me = async (req, res, next) => {
  res.json({
    success: true,
    data: {
      id: req.user._id,
      email: getDisplayEmail(req.user),
      fullName: req.user.fullName,
      role: req.user.role,
      userId: req.user.userId,
      phone: req.user.phone,
      department: req.user.department,
      academicYear: req.user.academicYear,
    },
  });
};
