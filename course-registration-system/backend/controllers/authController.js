const User = require('../models/User');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const generateToken = require('../utils/generateToken');
const { mergeProfileWithAccount } = require('../utils/profileHydration');

function getDisplayEmail(user) {
  return user.role === 'admin' ? 'Admin@iuh.edu.vn' : user.email;
}

exports.register = async (req, res, next) => {
  try {
    const { email, password, fullName } = req.body;
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const exist = await User.findOne({ email: normalizedEmail });
    if (exist) return res.status(409).json({ success: false, message: 'Email đã tồn tại' });
    const user = await User.create({ email: normalizedEmail, password, role: 'student' });
    const studentName = String(fullName || normalizedEmail.split('@')[0] || 'Sinh viên').trim();
    await Student.create({ _id: user._id, studentId: user.userId, fullName: studentName });
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
  const account = req.user;

  let profile = null;

  if (account.role === 'student') {
    profile = await Student.findById(account._id).lean();
  } else if (account.role === 'teacher') {
    profile = await Teacher.findById(account._id).lean();
  }

  const merged = mergeProfileWithAccount(profile, account);
  res.json({
    success: true,
    data: {
      id: merged._id,
      email: getDisplayEmail(merged),
      fullName: merged.fullName,
      role: merged.role,
      userId: merged.userId,
      phone: merged.phone,
      department: merged.department,
      academicYear: merged.academicYear,
    },
  });
};
