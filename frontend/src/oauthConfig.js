const defaultAuthority = `${window.location.protocol}//${window.location.hostname}:8080/realms/xpo-logistics`;

export const oauthConfig = {
  apiBase: import.meta.env.VITE_API_BASE || '',
  authority: import.meta.env.VITE_OAUTH_AUTHORITY || defaultAuthority,
  clientId: import.meta.env.VITE_OAUTH_CLIENT_ID || 'xpo-frontend',
  redirectUri: import.meta.env.VITE_OAUTH_REDIRECT_URI || `${window.location.origin}/oauth/callback`,
  scope: 'openid email profile',
};
