import assert from 'node:assert/strict';
import test from 'node:test';

import {
  clearStoredTokens,
  getAccessToken,
  getIdToken,
  getStoredTokens,
  setStoredTokens,
} from '../src/authTokens.js';

const createSessionStorage = () => {
  const values = new Map();

  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
  };
};

test.beforeEach(() => {
  globalThis.sessionStorage = createSessionStorage();
});

test('setStoredTokens stores api_token as the API bearer token', () => {
  setStoredTokens({
    api_token: 'api-token',
    access_token: 'access-token',
    id_token: 'id-token',
    refresh_token: 'refresh-token',
    expires_in: 120,
  });

  assert.equal(getAccessToken(), 'api-token');
  assert.equal(getIdToken(), 'id-token');
  assert.equal(getStoredTokens().refreshToken, 'refresh-token');
  assert.ok(getStoredTokens().expiresAt > Date.now());
});

test('setStoredTokens falls back to id_token when provider access token is not usable for API', () => {
  setStoredTokens({
    id_token: 'google-id-token',
    expires_in: 60,
  });

  assert.equal(getAccessToken(), 'google-id-token');
});

test('clearStoredTokens removes OAuth tokens from session storage', () => {
  setStoredTokens({ api_token: 'api-token' });
  clearStoredTokens();

  assert.equal(getStoredTokens(), null);
  assert.equal(getAccessToken(), null);
});

test('getStoredTokens returns null for malformed storage data', () => {
  sessionStorage.setItem('xpo.oauth.tokens', '{broken json');

  assert.equal(getStoredTokens(), null);
});
