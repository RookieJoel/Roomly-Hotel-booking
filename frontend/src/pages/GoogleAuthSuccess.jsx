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

          // Debug: Check all cookies
          console.log('All cookies:', document.cookie);

          // Get token from HTTP-only cookie (set by backend)
          const token = getCookie('token');
          
          console.log('Token from cookie:', token ? 'Found (' + token.substring(0, 20) + '...)' : 'Not found');
          
          if (!token) {
            console.error('❌ No token found in cookie');
            console.error('Possible causes:');
            console.error('1. Cookie not set by backend');
            console.error('2. SameSite cookie policy blocking');
            console.error('3. CORS credentials not enabled');
            console.error('4. Domain mismatch between frontend/backend');
            toast.error('Authentication failed. No token received.');
            navigate('/login');
            return;
          }

          console.log('✅ Token acquired from cookie successfully');

          // Save token to localStorage for axios interceptor
          // Note: In production, consider using the cookie directly
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
