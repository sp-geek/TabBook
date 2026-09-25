import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const isActive = (path) => location.pathname === path;

  return (
    <header>
      <Link to="/" className="brand">
  <img
    src="/tabbook-icon.png"
    alt="TabBook"
    className="logo-icon"
  />

  
    Tab<span className="coral">Book</span>
  
</Link>
      <nav>
        <Link to="/" className={isActive('/') ? 'active' : ''}>Discover</Link>
        {isAuthenticated && (
          <Link to="/my-bookings" className={isActive('/my-bookings') ? 'active' : ''}>Bookings</Link>
        )}
        {isAuthenticated && user?.role === 'OWNER' && (
          <Link to="/owner" className={isActive('/owner') ? 'active' : ''}>For restaurants</Link>
        )}
        {isAuthenticated ? (
          <>
            <span style={{ color: '#6f7872' }}>{user?.name}</span>
            <button className="ghost-btn" onClick={handleLogout}>Log out</button>
          </>
        ) : (
          <Link to="/login" className="dark-btn">Sign in</Link>
        )}
      </nav>
    </header>
  );
}
