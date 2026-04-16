module.exports = function (req, res, next) {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.max(1, parseInt(req.query.limit) || 30);
  const skip = (page - 1) * limit;
  req.pagination = { page, limit, skip };
  next();
};
