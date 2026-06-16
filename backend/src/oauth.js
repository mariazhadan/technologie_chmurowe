const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const db = require('./db');
const { rolePriority, roles: appRoles } = require('./apiPolicy');

const jwksCache = {
  keys: [],
  expiresAt: 0,
};

function getRequiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}

function splitList(value) {
  return (value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function getBooleanEnv(name, defaultValue = false) {
  const value = process.env[name];
  if (value === undefined) {
    return defaultValue;
  }

  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
}

function getDefaultRole() {
  const role = process.env.OAUTH_DEFAULT_ROLE || appRoles.MODERATOR;
  return rolePriority.includes(role) ? role : appRoles.MODERATOR;
}

function getOAuthConfig() {
  const issuerUrl = getRequiredEnv('OAUTH_ISSUER_URL');
  const allowedIssuers = splitList(process.env.OAUTH_ALLOWED_ISSUERS || issuerUrl);

  return {
    issuerUrl,
    allowedIssuers,
    jwksUrl: getRequiredEnv('OAUTH_JWKS_URL'),
    clientId: process.env.OAUTH_CLIENT_ID || '',
    clientSecret: process.env.OAUTH_CLIENT_SECRET || '',
    tokenUrl: process.env.OAUTH_TOKEN_URL || 'https://oauth2.googleapis.com/token',
    defaultRole: getDefaultRole(),
    useIdTokenForApi: getBooleanEnv('OAUTH_USE_ID_TOKEN_FOR_API'),
  };
}

function extractBearerToken(req) {
  const header = req.get('authorization') || '';
  const [scheme, token] = header.split(' ');

  if (scheme.toLowerCase() !== 'bearer' || !token) {
    return null;
  }

  return token;
}

async function fetchJwks(forceRefresh = false) {
  const now = Date.now();
  if (!forceRefresh && jwksCache.keys.length > 0 && jwksCache.expiresAt > now) {
    return jwksCache.keys;
  }

  const { jwksUrl } = getOAuthConfig();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);

  try {
    const response = await fetch(jwksUrl, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`JWKS request failed with ${response.status}`);
    }

    const jwks = await response.json();
    jwksCache.keys = jwks.keys || [];
    jwksCache.expiresAt = now + 5 * 60 * 1000;
    return jwksCache.keys;
  } finally {
    clearTimeout(timeout);
  }
}

function getPublicKey(jwk) {
  return crypto.createPublicKey({
    key: jwk,
    format: 'jwk',
  });
}

async function getSigningKey(decodedHeader) {
  let keys = await fetchJwks();
  let jwk = keys.find((key) => key.kid === decodedHeader.kid);

  if (!jwk) {
    keys = await fetchJwks(true);
    jwk = keys.find((key) => key.kid === decodedHeader.kid);
  }

  if (!jwk) {
    throw new Error('Signing key not found');
  }

  return getPublicKey(jwk);
}

function extractRoles(payload, clientId) {
  const providerRoles = (payload.roles && Array.isArray(payload.roles) ? payload.roles : []) || [];
  const resourceRoles =
    clientId && payload.resource_access && payload.resource_access[clientId]
      ? payload.resource_access[clientId].roles || []
      : [];
  const roles = new Set([...providerRoles, ...resourceRoles]);

  return rolePriority.filter((role) => roles.has(role));
}

function getPrimaryRole(roles) {
  return rolePriority.find((role) => roles.includes(role)) || null;
}

async function verifyAccessToken(token) {
  const decoded = jwt.decode(token, { complete: true });
  if (!decoded || !decoded.header) {
    throw new Error('Invalid token');
  }

  const { allowedIssuers, clientId } = getOAuthConfig();
  const publicKey = await getSigningKey(decoded.header);
  const payload = jwt.verify(token, publicKey, {
    algorithms: ['RS256'],
    issuer: allowedIssuers,
  });

  if (clientId && payload.azp && payload.azp !== clientId) {
    throw new Error('Invalid authorized party');
  }

  if (clientId && !payload.azp) {
    const audiences = Array.isArray(payload.aud) ? payload.aud : [payload.aud].filter(Boolean);
    if (!audiences.includes(clientId)) {
      throw new Error('Invalid audience');
    }
  }

  const roles = extractRoles(payload, clientId);
  const role = getPrimaryRole(roles);

  return {
    ...payload,
    appRole: role,
    appRoles: roles,
  };
}

async function syncOAuthUser(payload) {
  const oauthSubject = payload.sub;
  const email = payload.email || payload.preferred_username;

  if (!oauthSubject || !email) {
    throw new Error('OAuth token is missing subject or email');
  }

  if (payload.email_verified === false) {
    throw new Error('OAuth token email is not verified');
  }

  const { defaultRole } = getOAuthConfig();
  const existing = await db.query(
    `SELECT id, role
       FROM users
      WHERE oauth_subject = $1 OR email = $2
      ORDER BY CASE WHEN oauth_subject = $1 THEN 0 ELSE 1 END
      LIMIT 1`,
    [oauthSubject, email]
  );

  if (existing.rowCount > 0) {
    const role = payload.appRole || existing.rows[0].role || defaultRole;
    const result = await db.query(
      `UPDATE users
          SET oauth_subject = $1,
              email = $2,
              role = $3
        WHERE id = $4
        RETURNING id, oauth_subject, email, role`,
      [oauthSubject, email, role, existing.rows[0].id]
    );
    return result.rows[0];
  }

  const role = payload.appRole || defaultRole;
  const result = await db.query(
    `INSERT INTO users (oauth_subject, email, role)
     VALUES ($1, $2, $3)
     RETURNING id, oauth_subject, email, role`,
    [oauthSubject, email, role]
  );

  return result.rows[0];
}

async function authenticateRequest(req) {
  const token = extractBearerToken(req);
  if (!token) {
    return null;
  }

  const payload = await verifyAccessToken(token);
  const user = await syncOAuthUser(payload);

  return {
    id: user.id,
    oauthSubject: user.oauth_subject,
    email: user.email,
    role: user.role,
    roles: payload.appRoles,
  };
}

async function exchangeAuthorizationCode({ code, codeVerifier, redirectUri }) {
  if (!code || !codeVerifier || !redirectUri) {
    throw new Error('code, codeVerifier, and redirectUri are required');
  }

  const { clientId, clientSecret, tokenUrl, useIdTokenForApi } = getOAuthConfig();
  const body = new URLSearchParams({
    client_id: clientId,
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    code_verifier: codeVerifier,
  });

  if (clientSecret) {
    body.set('client_secret', clientSecret);
  }

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error_description || payload.error || 'OAuth token exchange failed');
  }

  return {
    ...payload,
    api_token: useIdTokenForApi && payload.id_token ? payload.id_token : payload.access_token,
  };
}

async function checkOAuthReady() {
  await fetchJwks();
  return true;
}

module.exports = {
  authenticateRequest,
  exchangeAuthorizationCode,
  checkOAuthReady,
};
