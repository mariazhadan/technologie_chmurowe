import { useLocation } from 'react-router-dom';
import { useAuth } from '../useAuth';

const Login = () => {
  const { login } = useAuth();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const handleLogin = () => {
    login(from);
  };

  return (
    <div className="container" style={{ maxWidth: '400px', marginTop: '10vh' }}>
      <h1>LOGIN</h1>
      <div className="card">
        <button type="button" onClick={handleLogin} style={{ width: '100%' }}>
          Login with Google
        </button>
      </div>
    </div>
  );
};

export default Login;
