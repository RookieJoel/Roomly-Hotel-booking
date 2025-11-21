import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import './Auth.css';

// Helper function to get cookie value
const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
};

const GoogleAuthSuccess = ({ setUser }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const handleGoogleAuth = async () => {
      const data = searchParams.get('data');
      const error = searchParams.get('error');

      console.log('=== GoogleAuthSuccess Debug ===');
      console.log('Current URL:', window.location.href);
      console.log('All URL params:', Object.fromEntries(searchParams.entries()));
      console.log('data:', data);
      console.log('error:', error);

      if (error) {
        toast.error('Google authentication failed. Please try again.');
        navigate('/login');
        return;
      }

      if (data) {
        try {
          console.log('Raw data received:', data);
          const userData = JSON.parse(decodeURIComponent(data));
          console.log('Parsed user data:', userData);
          const { name, email, _id, tel, role } = userData;
          console.log('Extracted values - name:', name, 'email:', email, '_id:', _id, 'tel:', tel, 'role:', role);

          // Wait a moment for cookie to be set by redirect
          await new Promise(resolve => setTimeout(resolve, 100));

          // Call backend to get token from HTTP-only cookie
          console.log('Fetching token from backend...');
          const response = await fetch('http://localhost:8080/api/v1/auth/me', {
            method: 'GET',
            credentials: 'include', // Send cookies with request
            headers: {
              'Content-Type': 'application/json'
            }
          });

          console.log('Response status:', response.status);

          if (!response.ok) {
            console.error('❌ Failed to verify authentication');
            console.error('Response status:', response.status);
            toast.error('Authentication failed. Please try again.');
            navigate('/login');
            return;
          }

          const authData = await response.json();
          console.log('Auth data:', authData);

          if (!authData.success || !authData.token) {
            console.error('❌ No token in response');
            toast.error('Authentication failed. No token received.');
            navigate('/login');
            return;
          }

          const token = authData.token;
          console.log('✅ Token acquired from backend:', token.substring(0, 20) + '...');

          // Save token to localStorage for axios interceptor
          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify({ name, email, _id, role }));

          // Update user state (include role so Navbar shows admin links)
          setUser({ name, email, _id, role });

          // If tel is missing or default, redirect to complete profile
          const needsComplete = !tel || tel === '0000000000' || tel === 'null';

          toast.success('Google authentication successful!');
          if (needsComplete) {
            navigate('/complete-profile');
          } else {
            navigate('/hotels');
          }
        } catch (err) {
          console.error('Error parsing Google auth data:', err);
          toast.error('Authentication failed. Please try again.');
          navigate('/login');
        }
      } else {
        console.log('No data received - data is:', data);
        toast.error('No authentication data received.');
        navigate('/login');
      }
    };

    handleGoogleAuth();
  }, [searchParams, navigate, setUser]);

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Processing Google Authentication...</h2>
        <p>Please wait while we complete your sign-in.</p>
      </div>
    </div>
  );
};

export default GoogleAuthSuccess;
