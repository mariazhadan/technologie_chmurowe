const express = require('express');
const auth = require('../middleware/auth');

const router = express.Router();

router.post('/login', (req, res) => {
  res.status(410).json({
    error: 'Password login has been replaced by OAuth 2.0 Authorization Code with PKCE',
  });
});

router.post('/logout', (req, res) => {
  res.json({ ok: true });
});

router.get('/me', auth, (req, res) => {
  res.json(req.user);
});

module.exports = router;
