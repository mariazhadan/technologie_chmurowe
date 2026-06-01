const { authenticateRequest } = require('../oauth');

module.exports = async (req, res, next) => {
  try {
    const user = await authenticateRequest(req);

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    req.user = user;
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
};
