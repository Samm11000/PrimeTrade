const Task = require('./Task.model');
const { sendSuccess, sendError } = require('../../utils/response');

/**
 * @desc    Get all tasks (admin: all tasks; user: own tasks only)
 * @route   GET /api/v1/tasks
 * @access  Private
 */
const getTasks = async (req, res, next) => {
  try {
    const filter = req.user.role === 'admin' ? {} : { owner: req.user._id };

    // Pagination
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    // Filtering by status/priority
    if (req.query.status) filter.status = req.query.status;
    if (req.query.priority) filter.priority = req.query.priority;

    const [tasks, total] = await Promise.all([
      Task.find(filter)
        .populate('owner', 'name email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Task.countDocuments(filter),
    ]);

    return sendSuccess(res, 200, 'Tasks fetched.', {
      tasks,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get single task by ID
 * @route   GET /api/v1/tasks/:id
 * @access  Private
 */
const getTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id).populate('owner', 'name email role');
    if (!task) return sendError(res, 404, 'Task not found.');

    // Non-admin users can only see their own tasks
    if (req.user.role !== 'admin' && task.owner._id.toString() !== req.user._id.toString()) {
      return sendError(res, 403, 'You do not have permission to view this task.');
    }

    return sendSuccess(res, 200, 'Task fetched.', { task });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Create a task
 * @route   POST /api/v1/tasks
 * @access  Private
 */
const createTask = async (req, res, next) => {
  try {
    const task = await Task.create({ ...req.body, owner: req.user._id });
    return sendSuccess(res, 201, 'Task created.', { task });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Update a task
 * @route   PUT /api/v1/tasks/:id
 * @access  Private
 */
const updateTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return sendError(res, 404, 'Task not found.');

    // Non-admin users can only update their own tasks
    if (req.user.role !== 'admin' && task.owner.toString() !== req.user._id.toString()) {
      return sendError(res, 403, 'You do not have permission to update this task.');
    }

    const updated = await Task.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('owner', 'name email role');

    return sendSuccess(res, 200, 'Task updated.', { task: updated });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Delete a task
 * @route   DELETE /api/v1/tasks/:id
 * @access  Private
 */
const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return sendError(res, 404, 'Task not found.');

    // Non-admin users can only delete their own tasks
    if (req.user.role !== 'admin' && task.owner.toString() !== req.user._id.toString()) {
      return sendError(res, 403, 'You do not have permission to delete this task.');
    }

    await task.deleteOne();
    return sendSuccess(res, 200, 'Task deleted.');
  } catch (err) {
    next(err);
  }
};

module.exports = { getTasks, getTask, createTask, updateTask, deleteTask };
