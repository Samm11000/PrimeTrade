const { sendError } = require('../utils/response');

/**
 * Factory function: Returns middleware that restricts access to specified roles.
 * Usage: roleGuard('admin') or roleGuard('user', 'admin')
 * @param {...string} roles - Allowed roles
 */
const roleGuard = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 401, 'Not authenticated.');
    }

    if (!roles.includes(req.user.role)) {
      return sendError(
        res,
        403,
        `Access denied. Required role: [${roles.join(', ')}]. Your role: ${req.user.role}.`
      );
    }

    next();
  };
};

module.exports = roleGuard;
