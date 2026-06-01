import { clearStoredTokens, getAccessToken } from './authTokens';
import { oauthConfig } from './oauthConfig';

export const withApiBase = (path) => `${oauthConfig.apiBase}${path}`;

export const apiFetch = async (path, options = {}) => {
  const token = getAccessToken();
  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(withApiBase(path), {
    ...options,
    headers,
  });

  if (response.status === 401) {
    clearStoredTokens();
    window.location.assign('/login');
  }

  return response;
};
