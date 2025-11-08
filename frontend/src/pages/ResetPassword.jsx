import { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { FaLock, FaCheckCircle } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { authAPI } from '../utils/api';
import './Auth.css';

const ResetPassword = () => {
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const navigate = useNavigate();
  const { resettoken } = useParams();

  const { password, confirmPassword } = formData;

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!password || !confirmPassword) {
      toast.error('Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const response = await authAPI.resetPassword(resettoken, { password, confirmPassword });

      if (response.data.success) {
        setResetSuccess(true);
        toast.success('Password reset successful!');
        
        // Save token and user data
        const { token, name, email, _id } = response.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify({ name, email, _id }));
        
        // Redirect to home after 2 seconds
        setTimeout(() => {
          navigate('/');
        }, 2000);
      }
    } catch (error) {
      const message = error.response?.data?.msg || 'Failed to reset password';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (resetSuccess) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h2>✅ Password Reset Successful!</h2>
          </div>
          
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <div style={{ fontSize: '64px', color: '#4caf50', marginBottom: '20px' }}>
              <FaCheckCircle />
            </div>
            <p style={{ marginBottom: '20px', lineHeight: '1.6' }}>
              Your password has been successfully reset.
            </p>
            <p style={{ color: '#666', fontSize: '14px' }}>
              Redirecting you to the home page...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h2>🔐 Reset Password</h2>
          <p>Enter your new password below.</p>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="password">
              <FaLock /> New Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              placeholder="Enter new password (min 6 characters)"
              value={password}
              onChange={handleChange}
              minLength="6"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">
              <FaLock /> Confirm Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              placeholder="Confirm your new password"
              value={confirmPassword}
              onChange={handleChange}
              minLength="6"
              required
            />
          </div>

          {password && confirmPassword && password !== confirmPassword && (
            <div style={{ 
              color: '#f44336', 
              fontSize: '14px', 
              marginBottom: '15px',
              padding: '10px',
              background: '#ffebee',
              borderRadius: '5px'
            }}>
              ⚠️ Passwords do not match
            </div>
          )}

          <button 
            type="submit" 
            className="btn btn-primary btn-block"
            disabled={loading}
          >
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>

        <div className="auth-footer">
          <Link to="/login">← Back to Login</Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
