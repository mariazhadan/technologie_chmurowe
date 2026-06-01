const requireRole = (...roles) => (req, res, next) => {
  const userRoles = req.user && Array.isArray(req.user.roles) ? req.user.roles : [];
  const fallbackRole = req.user && req.user.role;
  const effectiveRoles = new Set([...userRoles, fallbackRole].filter(Boolean));

  if (roles.some((role) => effectiveRoles.has(role))) {
    return next();
  }

  return res.status(403).json({
    error: 'Forbidden',
    requiredRoles: roles,
  });
};

module.exports = { requireRole };
