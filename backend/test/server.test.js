process.env.NODE_ENV = 'test';
process.env.DATABASE_URL ||= 'postgres://appuser:apppass@localhost:5432/appdb';
process.env.CORS_ALLOWED_ORIGINS = 'http://localhost,http://localhost:8080';

const assert = require('node:assert/strict');
const http = require('node:http');
const test = require('node:test');

const app = require('../src/server');
const { pool } = require('../src/db');

const withServer = async (callback) => {
  const server = http.createServer(app);

  await new Promise((resolve) => {
    server.listen(0, '127.0.0.1', resolve);
  });

  const { port } = server.address();
  const url = (path) => `http://127.0.0.1:${port}${path}`;

  try {
    await callback(url);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  }
};

test.after(async () => {
  await pool.end();
});

test('GET /health is public and returns service status', async () => {
  await withServer(async (url) => {
    const response = await fetch(url('/health'));
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.status, 'ok');
    assert.equal(body.service, 'xpo-logistics-api');
  });
});

test('CORS preflight allows configured localhost origins', async () => {
  await withServer(async (url) => {
    const response = await fetch(url('/api/auth/me'), {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost',
        'Access-Control-Request-Method': 'GET',
      },
    });

    assert.equal(response.status, 204);
    assert.equal(response.headers.get('access-control-allow-origin'), 'http://localhost');
    assert.match(response.headers.get('access-control-allow-headers'), /Authorization/);
  });
});

test('GET /api/auth/me rejects requests without Bearer token', async () => {
  await withServer(async (url) => {
    const response = await fetch(url('/api/auth/me'));
    const body = await response.json();

    assert.equal(response.status, 401);
    assert.equal(body.error, 'Unauthorized');
  });
});

test('POST /api/auth/login documents disabled password login', async () => {
  await withServer(async (url) => {
    const response = await fetch(url('/api/auth/login'), { method: 'POST' });
    const body = await response.json();

    assert.equal(response.status, 410);
    assert.match(body.error, /OAuth 2\.0/);
  });
});
