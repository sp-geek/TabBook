import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function ProfileIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4Zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4Z" />
    </svg>
  );
}

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
            <Link
              to="/profile"
              className="profile-icon-link"
              title={user?.name}
              aria-label="Your profile"
            >
              <span className="profile-icon">
                <ProfileIcon />
              </span>
            </Link>
            <button className="ghost-btn" onClick={handleLogout}>Log out</button>
          </>
        ) : (
          <Link to="/login" className="dark-btn">Sign in</Link>
        )}
      </nav>
    </header>
  );
}