const TOKEN_KEY = 'xpo.oauth.tokens';

export const getStoredTokens = () => {
  try {
    const raw = sessionStorage.getItem(TOKEN_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const setStoredTokens = (tokens) => {
  const expiresIn = Number(tokens.expires_in || 3600);
  sessionStorage.setItem(
    TOKEN_KEY,
    JSON.stringify({
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      idToken: tokens.id_token,
      expiresAt: Date.now() + Math.max(expiresIn - 30, 30) * 1000,
    })
  );
};

export const clearStoredTokens = () => {
  sessionStorage.removeItem(TOKEN_KEY);
};

export const getAccessToken = () => {
  const tokens = getStoredTokens();
  return tokens?.accessToken || null;
};

export const getIdToken = () => {
  const tokens = getStoredTokens();
  return tokens?.idToken || null;
};
