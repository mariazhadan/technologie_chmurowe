const express = require('express');
const { addSseClient, removeSseClient } = require('../mqtt');

const router = express.Router();

router.get('/shipments', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();
  res.write(': connected\n\n');

  addSseClient(res);

  const keepAlive = setInterval(() => {
    res.write(': ping\n\n');
  }, 25000);

  req.on('close', () => {
    clearInterval(keepAlive);
    removeSseClient(res);
    res.end();
  });
});

module.exports = router;
