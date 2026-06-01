const express = require('express');
const { body } = require('express-validator');
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');
const { validate } = require('../middleware/validate');
const { accessPolicy } = require('../apiPolicy');

const router = express.Router();

const warehouseRules = [
  body('name').trim().notEmpty().withMessage('name is required'),
  body('city').trim().notEmpty().withMessage('city is required'),
  body('capacity').toInt().isInt({ gt: 0 }).withMessage('capacity must be > 0'),
];

const db = require('../db');

router.use(auth, requireRole(...accessPolicy.warehouses));

router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM warehouses ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', validate(warehouseRules), async (req, res) => {
  try {
    const { name, city, capacity } = req.body;
    const result = await db.query(
      'INSERT INTO warehouses (name, city, capacity) VALUES ($1, $2, $3) RETURNING *',
      [name, city, capacity]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', validate(warehouseRules), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, city, capacity } = req.body;
    const result = await db.query(
      'UPDATE warehouses SET name = $1, city = $2, capacity = $3 WHERE id = $4 RETURNING *',
      [name, city, capacity, id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Warehouse not found' });
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
    const result = await db.query('DELETE FROM warehouses WHERE id = $1', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Warehouse not found' });
    }
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
