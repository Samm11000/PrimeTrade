const User = require('../auth/User.model');
const Task = require('../tasks/Task.model');
const { sendSuccess, sendError } = require('../../utils/response');

/**
 * @desc    Get all users (admin only)
 * @route   GET /api/v1/admin/users
 * @access  Admin
 */
const getAllUsers = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.countDocuments(),
    ]);

    return sendSuccess(res, 200, 'Users fetched.', {
      users,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get a specific user by ID (admin only)
 * @route   GET /api/v1/admin/users/:id
 * @access  Admin
 */
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return sendError(res, 404, 'User not found.');
    return sendSuccess(res, 200, 'User fetched.', { user });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Delete a user by ID (admin only)
 * @route   DELETE /api/v1/admin/users/:id
 * @access  Admin
 */
const deleteUser = async (req, res, next) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return sendError(res, 400, 'You cannot delete your own account.');
    }

    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return sendError(res, 404, 'User not found.');

    // Also delete all tasks belonging to the user
    await Task.deleteMany({ owner: req.params.id });

    return sendSuccess(res, 200, 'User and all their tasks deleted.');
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get platform stats (admin only)
 * @route   GET /api/v1/admin/stats
 * @access  Admin
 */
const getStats = async (req, res, next) => {
  try {
    const [totalUsers, totalTasks, tasksByStatus] = await Promise.all([
      User.countDocuments(),
      Task.countDocuments(),
      Task.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
    ]);

    return sendSuccess(res, 200, 'Stats fetched.', { totalUsers, totalTasks, tasksByStatus });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAllUsers, getUserById, deleteUser, getStats };
