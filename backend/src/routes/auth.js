const express = require('express');
const auth = require('../middleware/auth');
const { exchangeAuthorizationCode } = require('../oauth');

const router = express.Router();

router.post('/login', (req, res) => {
  res.status(410).json({
    error: 'Password login has been replaced by OAuth 2.0 Authorization Code with PKCE',
  });
});

router.post('/logout', (req, res) => {
  res.json({ ok: true });
});

router.post('/token', async (req, res) => {
  try {
    const tokens = await exchangeAuthorizationCode({
      code: req.body.code,
      codeVerifier: req.body.codeVerifier || req.body.code_verifier,
      redirectUri: req.body.redirectUri || req.body.redirect_uri,
    });

    res.json(tokens);
  } catch (err) {
    console.error('OAuth token exchange failed:', err.message);
    res.status(400).json({ error: 'OAuth token exchange failed' });
  }
});

router.get('/me', auth, (req, res) => {
  res.json(req.user);
});

module.exports = router;
