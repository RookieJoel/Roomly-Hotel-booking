import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaEnvelope, FaLock, FaGoogle } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { authAPI } from '../utils/api';
import './Auth.css';

const Login = ({ setUser }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const { email, password } = formData;

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleGoogleLogin = () => {
    // Redirect to backend Google OAuth endpoint
    window.location.href = 'http://localhost:8080/api/v1/auth/google';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);

    try {
      const response = await authAPI.login({ email, password });
      
      if (response.data.success) {
        const { token, name, email, _id } = response.data;
        
        // Save to localStorage
        localStorage.setItem('token', token);
        // Fetch complete user (to get role) then save
        try {
          const meResp = await authAPI.getMe();
          const me = meResp.data && meResp.data.data ? meResp.data.data : { name, email, _id };
          const userToStore = { name: me.name || name, email: me.email || email, _id: me._id || _id, role: me.role || 'user' };
          localStorage.setItem('user', JSON.stringify(userToStore));
          setUser(userToStore);
        } catch (err) {
          // fallback
          localStorage.setItem('user', JSON.stringify({ name, email, _id }));
          setUser({ name, email, _id });
        }
        
        toast.success('Login successful!');
        navigate('/hotels');
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      console.error('Error response:', error.response);
      console.error('Error data:', error.response?.data);
      
      // Get error message from backend
      let errorMessage = 'Login failed. Please try again.';
      
      if (error.response?.data?.msg) {
        errorMessage = error.response.data.msg;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      console.error('Displaying error:', errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">Welcome Back!</h1>
        <p className="auth-subtitle">Login to your Roomly account</p>
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">
              <FaEnvelope /> Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">
              <FaLock /> Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={password}
              onChange={handleChange}
              placeholder="Enter your password"
              required
            />
          </div>

          <div style={{ textAlign: 'right', marginBottom: '15px' }}>
            <Link 
              to="/forgot-password" 
              style={{ 
                color: '#667eea', 
                fontSize: '14px',
                textDecoration: 'none'
              }}
            >
              Forgot Password?
            </Link>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary btn-block"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="auth-divider">
          <span>OR</span>
        </div>

        <button 
          type="button" 
          className="btn btn-google btn-block"
          onClick={handleGoogleLogin}
        >
          <FaGoogle /> Continue with Google
        </button>

        <p className="auth-footer">
          Don't have an account? <Link to="/register">Register here</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
