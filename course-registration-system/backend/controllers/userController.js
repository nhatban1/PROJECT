const User = require('../models/User');

exports.getUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;
    const filter = {};

    if (req.query.role) {
      filter.role = req.query.role;
    }

    const users = await User.find(filter).skip(skip).limit(Number(limit)).select('-password');
    const total = await User.countDocuments(filter);
    res.json({ success: true, data: users, total, page: Number(page), limit: Number(limit) });
  } catch (err) { next(err); }
};

exports.getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
};

exports.createUser = async (req, res, next) => {
  try {
    const payload = { ...req.body };

    if (payload.email) {
      payload.email = String(payload.email).trim().toLowerCase();
    }

    const user = await User.create(payload);
    res.status(201).json({ success: true, data: user });
  } catch (err) { next(err); }
};

exports.updateUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const { password, role, email, fullName, phone, department, academicYear, isActive } = req.body;

    if (role && role !== user.role) {
      return res.status(400).json({ success: false, message: 'Không thể thay đổi vai trò của tài khoản hiện có' });
    }

    if (email !== undefined) user.email = String(email).trim().toLowerCase();
    if (fullName !== undefined) user.fullName = fullName;
    if (phone !== undefined) user.phone = phone;
    if (department !== undefined) user.department = department;
    if (academicYear !== undefined) user.academicYear = academicYear;
    if (isActive !== undefined) user.isActive = isActive;
    if (password) user.password = password;

    await user.save();
    const safeUser = user.toObject();
    delete safeUser.password;
    res.json({ success: true, data: safeUser });
  } catch (err) { next(err); }
};

exports.deleteUser = async (req, res, next) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) { next(err); }
};
