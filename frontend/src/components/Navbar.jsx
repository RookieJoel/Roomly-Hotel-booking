import { Link, useNavigate } from 'react-router-dom';
import { FaHotel, FaUser, FaSignOutAlt } from 'react-icons/fa';
import { toast } from 'react-toastify';
import './Navbar.css';

const Navbar = ({ user, setUser }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    toast.success('Logged out successfully!');
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-logo">
          <FaHotel /> Roomly
        </Link>
        
        <ul className="nav-menu">
          <li className="nav-item">
            <Link to="/" className="nav-link">Home</Link>
          </li>
          
          {user ? (
            <>
              <li className="nav-item">
                <Link to="/hotels" className="nav-link">Hotels</Link>
              </li>
              <li className="nav-item">
                <Link to="/bookings" className="nav-link">My Bookings</Link>
              </li>
              <li className="nav-item">
                <span className="nav-user">
                  <FaUser /> {user.name}
                </span>
              </li>
              <li className="nav-item">
                <button onClick={handleLogout} className="btn btn-secondary">
                  <FaSignOutAlt /> Logout
                </button>
              </li>
            </>
          ) : (
            <>
              <li className="nav-item">
                <Link to="/login" className="btn btn-secondary">Login</Link>
              </li>
              <li className="nav-item">
                <Link to="/register" className="btn btn-primary">Register</Link>
              </li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
