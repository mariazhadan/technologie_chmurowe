import { Link } from 'react-router-dom';
import { useAuth } from '../useAuth';

const Navbar = () => {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  if (!user) return null;

  return (
    <nav className="nav">
      <div className="nav-links">
        <Link to="/">[DASHBOARD]</Link>
        {user.role === 'admin' && <Link to="/users">[USERS]</Link>}
        <Link to="/warehouses">[WAREHOUSES]</Link>
        <Link to="/shipments">[SHIPMENTS]</Link>
        <Link to="/vehicles">[VEHICLES]</Link>
      </div>
      <div>
        <span>{user.email} ({user.role}) </span>
        <button onClick={handleLogout}>LOGOUT</button>
      </div>
    </nav>
  );
};

export default Navbar;
