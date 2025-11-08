import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import './Auth.css';

const GoogleAuthSuccess = ({ setUser }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const handleGoogleAuth = () => {
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
          const { token, name, email, _id, tel, role } = userData;
          console.log('Extracted values - token:', token, 'name:', name, 'email:', email, '_id:', _id, 'tel:', tel, 'role:', role);

          // Save token and user (including role) to localStorage
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
