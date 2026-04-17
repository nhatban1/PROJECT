const User = require('../models/User');
const generateToken = require('../utils/generateToken');

exports.register = async (req, res, next) => {
  try {
    const { email, password, fullName } = req.body;
    const exist = await User.findOne({ email });
    if (exist) return res.status(409).json({ success: false, message: 'Email đã tồn tại' });
    const user = await User.create({ email, password, fullName, role: 'student' });
    res.status(201).json({ success: true, data: { id: user._id, email: user.email, token: generateToken(user) } });
  } catch (err) { next(err); }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) return res.status(401).json({ success: false, message: 'Sai email hoặc mật khẩu' });
    res.json({ success: true, data: { id: user._id, email: user.email, token: generateToken(user) } });
  } catch (err) { next(err); }
};

exports.me = async (req, res, next) => {
  res.json({
    success: true,
    data: {
      id: req.user._id,
      email: req.user.email,
      fullName: req.user.fullName,
      role: req.user.role,
      userId: req.user.userId,
      phone: req.user.phone,
      department: req.user.department,
      academicYear: req.user.academicYear,
    },
  });
};
