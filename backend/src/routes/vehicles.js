const express = require('express');
const { body } = require('express-validator');
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');
const { validate } = require('../middleware/validate');
const db = require('../db');
const { accessPolicy, vehicleStatuses } = require('../apiPolicy');

const router = express.Router();

const vehicleRules = [
  body('plate').trim().notEmpty().withMessage('plate is required'),
  body('type').trim().notEmpty().withMessage('type is required'),
  body('status')
    .trim()
    .toUpperCase()
    .isIn(vehicleStatuses)
    .withMessage(`status must be one of: ${vehicleStatuses.join(', ')}`),
];

router.use(auth, requireRole(...accessPolicy.vehicles));

router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM vehicles ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching vehicles:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', validate(vehicleRules), async (req, res) => {
  try {
    const { plate, type, status } = req.body;
    const result = await db.query(
      'INSERT INTO vehicles (plate, type, status) VALUES ($1, $2, $3) RETURNING *',
      [plate, type, status]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating vehicle:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', validate(vehicleRules), async (req, res) => {
  try {
    const { id } = req.params;
    const { plate, type, status } = req.body;
    const result = await db.query(
      'UPDATE vehicles SET plate = $1, type = $2, status = $3 WHERE id = $4 RETURNING *',
      [plate, type, status, id]
    );
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating vehicle:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('DELETE FROM vehicles WHERE id = $1', [id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }
    
    res.json({ ok: true });
  } catch (err) {
    console.error('Error deleting vehicle:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
