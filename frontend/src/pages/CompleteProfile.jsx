import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { authAPI } from '../utils/api';
import './Auth.css';

const CompleteProfile = ({ setUser }) => {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', tel: '', role: 'user' });
  const navigate = useNavigate();

  useEffect(() => {
    // Prefill from localStorage if available
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (user) {
        setForm((f) => ({ ...f, name: user.name || '' }));
      }
    } catch (e) {}

    // Optionally fetch /auth/me to get current values
    const fetchMe = async () => {
      try {
        const res = await authAPI.getMe();
        if (res.data && res.data.data) {
          const me = res.data.data;
          setForm({ name: me.name || '', tel: me.tel || '', role: me.role || 'user' });
        }
      } catch (err) {
        // ignore; user may not have token yet
      }
    };

    fetchMe();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authAPI.updateProfile(form);
      if (res.data && res.data.success) {
        const updated = res.data.data;
        localStorage.setItem('user', JSON.stringify({ name: updated.name, email: updated.email, _id: updated._id }));
        setUser({ name: updated.name, email: updated.email, _id: updated._id });
        toast.success('Profile updated');
        navigate('/hotels');
      } else {
        toast.error('Failed to update profile');
      }
    } catch (err) {
      console.error('Update profile error', err);
      toast.error(err.response?.data?.msg || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">Complete your profile</h1>
        <p className="auth-subtitle">We need a few more details to finish your account</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input id="name" name="name" value={form.name} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label htmlFor="tel">Phone Number</label>
            <input id="tel" name="tel" value={form.tel} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label htmlFor="role">Role</label>
            <select id="role" name="role" value={form.role} onChange={handleChange}>
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <button className="btn btn-primary btn-block" type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save'}</button>
        </form>
      </div>
    </div>
  );
};

export default CompleteProfile;
