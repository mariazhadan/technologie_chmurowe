const { validationResult } = require('express-validator');

const validate = (rules) => async (req, res, next) => {
  await Promise.all(rules.map((rule) => rule.run(req)));

  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }

  return res.status(400).json({
    error: 'Validation error',
    details: errors.array().map((err) => ({
      field: err.param || err.path,
      message: err.msg,
    })),
  });
};

module.exports = { validate };
