import { useCallback, useEffect, useState } from 'react';
import { apiFetch, withApiBase } from './api';
import { AuthContext } from './authContext';
import { clearStoredTokens, getAccessToken, getIdToken, setStoredTokens } from './authTokens';
import { oauthConfig } from './oauthConfig';

const STATE_KEY = 'xpo.oauth.state';
const VERIFIER_KEY = 'xpo.oauth.verifier';
const RETURN_TO_KEY = 'xpo.oauth.returnTo';

const base64Url = (buffer) => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};

const randomString = () => {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return base64Url(bytes);
};

const createCodeChallenge = async (verifier) => {
  const encoded = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', encoded);
  return base64Url(digest);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(() => Boolean(getAccessToken()));

  const loadUser = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      return null;
    }

    const res = await apiFetch('/api/auth/me');
    const data = await res.json();
    if (!res.ok || data.error || !data.email) {
      clearStoredTokens();
      setUser(null);
      return null;
    }

    setUser(data);
    return data;
  }, []);

  useEffect(() => {
    if (!getAccessToken()) {
      return;
    }

    let active = true;

    const init = async () => {
      try {
        await loadUser();
      } catch {
        clearStoredTokens();
        if (active) {
          setUser(null);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    init();

    return () => {
      active = false;
    };
  }, [loadUser]);

  const login = useCallback(async (returnTo = '/') => {
    const state = randomString();
    const verifier = randomString();
    const challenge = await createCodeChallenge(verifier);
    const authUrl = new URL(`${oauthConfig.authority}/protocol/openid-connect/auth`);

    sessionStorage.setItem(STATE_KEY, state);
    sessionStorage.setItem(VERIFIER_KEY, verifier);
    sessionStorage.setItem(RETURN_TO_KEY, returnTo);

    authUrl.search = new URLSearchParams({
      client_id: oauthConfig.clientId,
      redirect_uri: oauthConfig.redirectUri,
      response_type: 'code',
      scope: oauthConfig.scope,
      state,
      code_challenge: challenge,
      code_challenge_method: 'S256',
    }).toString();

    window.location.assign(authUrl.toString());
  }, []);

  const completeLogin = useCallback(async (searchParams) => {
    const error = searchParams.get('error');
    if (error) {
      throw new Error(error);
    }

    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const savedState = sessionStorage.getItem(STATE_KEY);
    const verifier = sessionStorage.getItem(VERIFIER_KEY);

    if (!code || !state || state !== savedState || !verifier) {
      throw new Error('Invalid OAuth callback');
    }

    const tokenRes = await fetch(`${oauthConfig.authority}/protocol/openid-connect/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: oauthConfig.clientId,
        grant_type: 'authorization_code',
        code,
        redirect_uri: oauthConfig.redirectUri,
        code_verifier: verifier,
      }),
    });

    const tokens = await tokenRes.json();
    if (!tokenRes.ok) {
      throw new Error(tokens.error_description || tokens.error || 'OAuth token exchange failed');
    }

    setStoredTokens(tokens);
    sessionStorage.removeItem(STATE_KEY);
    sessionStorage.removeItem(VERIFIER_KEY);

    await loadUser();

    const returnTo = sessionStorage.getItem(RETURN_TO_KEY) || '/';
    sessionStorage.removeItem(RETURN_TO_KEY);
    return returnTo;
  }, [loadUser]);

  const logout = useCallback(async () => {
    await fetch(withApiBase('/api/auth/logout'), { method: 'POST' });
    const idToken = getIdToken();
    setUser(null);
    clearStoredTokens();

    const logoutUrl = new URL(`${oauthConfig.authority}/protocol/openid-connect/logout`);
    logoutUrl.searchParams.set('client_id', oauthConfig.clientId);
    logoutUrl.searchParams.set('post_logout_redirect_uri', `${window.location.origin}/login`);
    if (idToken) {
      logoutUrl.searchParams.set('id_token_hint', idToken);
    }

    window.location.replace(logoutUrl.toString());
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, completeLogin, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
