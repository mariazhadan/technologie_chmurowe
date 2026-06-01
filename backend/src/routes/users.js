const express = require('express');
const { body } = require('express-validator');
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');
const { validate } = require('../middleware/validate');
const { accessPolicy } = require('../apiPolicy');
const router = express.Router();

router.use(auth, requireRole(...accessPolicy.users));

const userRules = [
  body('oauthSubject').trim().notEmpty().withMessage('oauthSubject is required'),
  body('email').trim().isEmail().withMessage('email must be valid').normalizeEmail(),
  body('role')
    .trim()
    .toLowerCase()
    .isIn(['admin', 'moderator'])
    .withMessage('role must be admin or moderator'),
];

const db = require('../db');

router.get('/', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id,
              oauth_subject AS "oauthSubject",
              email,
              role
         FROM users
        ORDER BY id ASC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', validate(userRules), async (req, res) => {
  try {
    const { oauthSubject, email, role } = req.body;
    
    const result = await db.query(
      `INSERT INTO users (oauth_subject, email, role)
       VALUES ($1, $2, $3)
       RETURNING id, oauth_subject AS "oauthSubject", email, role`,
      [oauthSubject, email, role]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    if (err.code === '23505') {
       return res.status(400).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', validate(userRules), async (req, res) => {
  try {
    const { id } = req.params;
    const { oauthSubject, email, role } = req.body;

    const result = await db.query(
      `UPDATE users
          SET oauth_subject = $1,
              email = $2,
              role = $3
        WHERE id = $4
        RETURNING id, oauth_subject AS "oauthSubject", email, role`,
      [oauthSubject, email, role, id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('DELETE FROM users WHERE id = $1', [id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
