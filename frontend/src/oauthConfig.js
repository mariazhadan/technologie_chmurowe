const runtimeConfig = window.__XPO_CONFIG__ || {};
const viteEnv = import.meta.env || {};

const configValue = (name, fallback = '') => runtimeConfig[name] || viteEnv[name] || fallback;

const publicAppUrl = configValue('PUBLIC_APP_URL', window.location.origin).replace(/\/$/, '');
const authorizationEndpoint = configValue(
  'VITE_OAUTH_AUTHORIZATION_URL',
  'https://accounts.google.com/o/oauth2/v2/auth'
);
const logoutEndpoint = configValue('VITE_OAUTH_LOGOUT_URL');

export const oauthConfig = {
  apiBase: configValue('VITE_API_BASE', publicAppUrl).replace(/\/$/, ''),
  authorizationEndpoint,
  tokenPath: configValue('VITE_OAUTH_TOKEN_PATH', '/api/auth/token'),
  logoutEndpoint,
  clientId: configValue('VITE_OAUTH_CLIENT_ID', 'CHANGE_ME_GOOGLE_CLIENT_ID'),
  redirectUri: configValue('VITE_OAUTH_REDIRECT_URI', `${publicAppUrl}/oauth/callback`),
  googleRedirectUri: configValue('VITE_GOOGLE_REDIRECT_URI', `${publicAppUrl}/oauth/callback`),
  scope: configValue('VITE_OAUTH_SCOPE', 'openid email profile'),
};
