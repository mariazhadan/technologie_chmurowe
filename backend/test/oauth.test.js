process.env.NODE_ENV = 'test';
process.env.DATABASE_URL ||= 'postgres://appuser:apppass@localhost:5432/appdb';
process.env.OAUTH_ISSUER_URL = 'https://accounts.google.com';
process.env.OAUTH_JWKS_URL = 'https://www.googleapis.com/oauth2/v3/certs';
process.env.OAUTH_TOKEN_URL = 'https://oauth2.googleapis.com/token';
process.env.OAUTH_CLIENT_ID = 'google-client-id.apps.googleusercontent.com';
process.env.OAUTH_CLIENT_SECRET = 'test-client-secret';
process.env.OAUTH_USE_ID_TOKEN_FOR_API = 'true';

const assert = require('node:assert/strict');
const test = require('node:test');

const { exchangeAuthorizationCode } = require('../src/oauth');
const { pool } = require('../src/db');

test.after(async () => {
  await pool.end();
});

test('exchangeAuthorizationCode sends PKCE token request to Google token endpoint', async (t) => {
  const originalFetch = global.fetch;

  t.after(() => {
    global.fetch = originalFetch;
  });

  global.fetch = async (url, options) => {
    assert.equal(url, 'https://oauth2.googleapis.com/token');
    assert.equal(options.method, 'POST');
    assert.equal(options.headers['Content-Type'], 'application/x-www-form-urlencoded');

    const body = options.body;
    assert.equal(body.get('client_id'), 'google-client-id.apps.googleusercontent.com');
    assert.equal(body.get('client_secret'), 'test-client-secret');
    assert.equal(body.get('grant_type'), 'authorization_code');
    assert.equal(body.get('code'), 'auth-code');
    assert.equal(body.get('redirect_uri'), 'http://localhost/oauth/callback');
    assert.equal(body.get('code_verifier'), 'pkce-verifier');

    return {
      ok: true,
      json: async () => ({
        access_token: 'google-access-token',
        id_token: 'google-id-token',
        expires_in: 3600,
      }),
    };
  };

  const result = await exchangeAuthorizationCode({
    code: 'auth-code',
    codeVerifier: 'pkce-verifier',
    redirectUri: 'http://localhost/oauth/callback',
  });

  assert.equal(result.access_token, 'google-access-token');
  assert.equal(result.id_token, 'google-id-token');
  assert.equal(result.api_token, 'google-id-token');
});

test('exchangeAuthorizationCode validates required PKCE fields before calling provider', async (t) => {
  const originalFetch = global.fetch;

  t.after(() => {
    global.fetch = originalFetch;
  });

  global.fetch = async () => {
    throw new Error('fetch should not be called');
  };

  await assert.rejects(
    () => exchangeAuthorizationCode({ code: '', codeVerifier: 'verifier', redirectUri: 'uri' }),
    /code, codeVerifier, and redirectUri are required/
  );
});
