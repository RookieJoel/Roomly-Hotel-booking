import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useState, useEffect } from 'react';
import './App.css';
import { authAPI } from './utils/api';

// Import components
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Hotels from './pages/Hotels';
import Bookings from './pages/Bookings';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import GoogleAuthSuccess from './pages/GoogleAuthSuccess';
import CompleteProfile from './pages/CompleteProfile';


function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    const hydrateUser = async () => {
      if (!token) return;

      if (userData) {
        try {
          const parsed = JSON.parse(userData);
          // If role already included, use it
          if (parsed && parsed.role) {
            setUser(parsed);
            return;
          }
        } catch (e) {
          // ignore
        }
      }

      // If we have a token but no role, fetch /auth/me to get full user
      try {
        const res = await authAPI.getMe();
        if (res.data && res.data.data) {
          const me = res.data.data;
          const userToStore = { name: me.name, email: me.email, _id: me._id, role: me.role };
          localStorage.setItem('user', JSON.stringify(userToStore));
          setUser(userToStore);
          return;
        }
      } catch (err) {
        // failed to fetch me; fall back to whatever we have
        try {
          if (userData) setUser(JSON.parse(userData));
        } catch (e) { }
      }
    };

    hydrateUser();
    setLoading(false);
  }, []);

  const ProtectedRoute = ({ children }) => {
    if (loading) return <div>Loading...</div>;
    return user ? children : <Navigate to="/login" />;
  };

  return (
    <Router>
      <div className="App">
        <Navbar user={user} setUser={setUser} />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route 
            path="/login" 
            element={user ? <Navigate to="/hotels" /> : <Login setUser={setUser} />} 
          />
          <Route 
            path="/register" 
            element={user ? <Navigate to="/hotels" /> : <Register setUser={setUser} />} 
          />
          <Route 
            path="/forgot-password" 
            element={user ? <Navigate to="/hotels" /> : <ForgotPassword />} 
          />
          <Route 
            path="/reset-password/:resettoken" 
            element={<ResetPassword />} 
          />
          <Route 
            path="/auth/google/callback" 
            element={<GoogleAuthSuccess setUser={setUser} />} 
          />
          <Route 
            path="/complete-profile" 
            element={<CompleteProfile setUser={setUser} />} 
          />
          <Route 
            path="/hotels" 
            element={
              <ProtectedRoute>
                <Hotels />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/bookings" 
            element={
              <ProtectedRoute>
                <Bookings />
              </ProtectedRoute>
            } 
          />
        </Routes>
        <ToastContainer position="top-right" autoClose={3000} />
      </div>
    </Router>
  );
}

export default App;
