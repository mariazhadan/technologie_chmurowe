const express = require('express');
const { incrementCacheProof } = require('../redisClient');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const proof = await incrementCacheProof();

    return res.json({
      component: 'redis',
      status: 'ok',
      proof,
    });
  } catch (err) {
    console.error('Redis proof failed:', err.message);

    return res.status(503).json({
      component: 'redis',
      status: 'not_ready',
      error: err.message,
    });
  }
});

module.exports = router;
