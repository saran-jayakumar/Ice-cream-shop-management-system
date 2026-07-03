import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/authService';
import { useToast } from '../hooks/useToast';
import Spinner from '../components/Spinner';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      showToast('Please fill in all fields', 'error');
      return;
    }

    setLoading(true);
    try {
      const data = await authService.login(email, password);
      showToast(`Welcome back, ${data.name}!`, 'success');
      
      // Redirect based on role
      switch (data.role) {
        case 'OWNER':
          navigate('/owner-dashboard');
          break;
        case 'ASSISTANT_MANAGER':
          navigate('/manager-dashboard');
          break;
        case 'CASHIER':
          navigate('/cashier-dashboard');
          break;
        case 'SERVER':
          navigate('/server-dashboard');
          break;
        default:
          navigate('/login');
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Invalid credentials. Please try again.';
      showToast(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <Spinner show={loading} />
      
      <div className="login-card">
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <img src="/logo.png" alt="One Scoop Logo" style={{ width: '220px', height: '220px', objectFit: 'contain', marginBottom: '16px', filter: 'drop-shadow(0 8px 16px rgba(245, 163, 183, 0.2))' }} />
          <h2 className="text-gradient-fancy" style={{ fontSize: '40px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '6px', marginBottom: '8px' }}>ONE SCOOP</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Ice Cream Shop Management System
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="email-input">Email Address</label>
            <input
              type="email"
              id="email-input"
              className="input-field"
              placeholder="e.g. owner@onescoop.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: '32px' }}>
            <label className="form-label" htmlFor="password-input">Password</label>
            <input
              type="password"
              id="password-input"
              className="input-field"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '14px', marginBottom: '16px' }}>
            Sign In to Shop
          </button>
        </form>

        <div style={{ textAlign: 'center', fontSize: '14px', marginTop: '16px' }}>
          <span style={{ color: 'var(--text-muted)' }}>Don't have an account? </span>
          <Link to="/create-account" style={{ color: 'var(--color-primary)', fontWeight: 'var(--font-weight-semibold)', textDecoration: 'none' }}>
            Create Account
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
