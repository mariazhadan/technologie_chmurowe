const express = require('express');
const { body } = require('express-validator');
const db = require('../db');
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');
const { appLog } = require('../appLog');
const { validate } = require('../middleware/validate');
const { accessPolicy, shipmentStatuses } = require('../apiPolicy');

const router = express.Router();

const shipmentCreateRules = [
  body('title').trim().notEmpty().withMessage('title is required'),
  body('origin').trim().notEmpty().withMessage('origin is required'),
  body('destination').trim().notEmpty().withMessage('destination is required'),
  body('status')
    .trim()
    .toUpperCase()
    .isIn(shipmentStatuses)
    .withMessage(`status must be one of: ${shipmentStatuses.join(', ')}`),
];
const shipmentUpdateRules = [
  body('status')
    .trim()
    .toUpperCase()
    .isIn(shipmentStatuses)
    .withMessage(`status must be one of: ${shipmentStatuses.join(', ')}`),
];

router.use(auth, requireRole(...accessPolicy.shipments));

router.get('/', async (req, res) => {
  try {
    const { search } = req.query || {};
    let result;

    if (search) {
      const pattern = `%${search}%`;
      result = await db.query(
        'SELECT * FROM shipments WHERE title ILIKE $1 OR destination ILIKE $1 ORDER BY created_at DESC',
        [pattern]
      );
    } else {
      result = await db.query('SELECT * FROM shipments ORDER BY created_at DESC');
    }

    res.json(result.rows);
  } catch (err) {
    console.error('Error is occured:', err);
    res.status(500).json({ error: 'Server error while fetching data' });
  }
});

router.post('/', validate(shipmentCreateRules), async (req, res) => {
  try {
    const { title, origin, destination, status } = req.body || {};
    const createdBy = req.user && req.user.id;
    const result = await db.query(
      `INSERT INTO shipments (title, origin, destination, status, created_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, title, origin, destination, status, created_by, created_at`,
      [title, origin, destination, status || 'CREATED', createdBy]
    );
    const row = result.rows[0];

    appLog('shipment_created', {
      id: row.id,
      title: row.title,
      destination: row.destination,
      status: row.status,
      createdAt: row.created_at,
      createdBy: createdBy || null,
    });

    res.status(201).json(row);
  } catch (err) {
    console.error('Error is occured:', err);
    res.status(500).json({ error: 'Server error while creating shipment' });
  }
});

router.put('/:id', validate(shipmentUpdateRules), async (req, res) => {
  try {
    const shipmentId = req.params.id;
    const { status } = req.body || {};
    const result = await db.query(
      `UPDATE shipments
          SET status = $1
        WHERE id = $2
        RETURNING id, title, origin, destination, status, created_by, created_at`,
      [status, shipmentId]
    );
    const row = result.rows[0];

    if (!row) {
      return res.status(404).json({ error: 'Shipment not found' });
    }

    const updatedAt = new Date().toISOString();
    appLog('shipment_updated', {
      id: row.id,
      status: row.status,
      updatedAt,
    });

    return res.json(row);
  } catch (err) {
    console.error('Error is occured:', err);
    return res.status(500).json({ error: 'Server error while updating shipment' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const shipmentId = req.params.id;
    const result = await db.query('DELETE FROM shipments WHERE id = $1', [shipmentId]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Shipment not found' });
    }

    res.json({ ok: true });
  } catch (err) {
    console.error('Error is occured:', err);
    res.status(500).json({ error: 'Server error while deleting shipment' });
  }
});

module.exports = router;
