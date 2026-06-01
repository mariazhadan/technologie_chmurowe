import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../useAuth';

const OAuthCallback = () => {
  const [error, setError] = useState('');
  const { completeLogin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) {
      return;
    }
    handled.current = true;

    const params = new URLSearchParams(location.search);
    completeLogin(params)
      .then((returnTo) => {
        navigate(returnTo, { replace: true });
      })
      .catch((err) => {
        setError(err.message || 'OAuth login failed');
      });
  }, [completeLogin, location.search, navigate]);

  return (
    <div className="container" style={{ maxWidth: '400px', marginTop: '10vh' }}>
      <h1>LOGIN</h1>
      <div className="card">
        {error ? <div className="error">{error}</div> : <p>Completing OAuth login...</p>}
      </div>
    </div>
  );
};

export default OAuthCallback;
