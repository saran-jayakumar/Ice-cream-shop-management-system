import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/authService';
import { useToast } from '../hooks/useToast';
import Spinner from '../components/Spinner';

const Signup = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role] = useState('OWNER');
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  
  const navigate = useNavigate();
  const { showToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password || !role) {
      showToast('Please fill in all fields', 'error');
      return;
    }

    setLoading(true);
    try {
      await authService.signup(name, email, password, role);
      setShowSuccessModal(true);
    } catch (err) {
      const errorMsg = err.response?.data || 'Failed to create account. Please try again.';
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
          <img src="/logo.png" alt="One Scoop Logo" style={{ width: '200px', height: '200px', objectFit: 'contain', marginBottom: '16px', filter: 'drop-shadow(0 8px 16px rgba(245, 163, 183, 0.2))' }} />
          <h2 className="text-gradient-fancy" style={{ fontSize: '36px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '6px', marginBottom: '8px' }}>ONE SCOOP</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Create an account to manage your shop
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label className="form-label" htmlFor="name-input">Full Name</label>
            <input
              type="text"
              id="name-input"
              className="input-field"
              placeholder="e.g. John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label className="form-label" htmlFor="email-input">Email Address</label>
            <input
              type="email"
              id="email-input"
              className="input-field"
              placeholder="e.g. name@onescoop.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: '16px' }}>
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
            Create Account
          </button>
        </form>

        <div style={{ textAlign: 'center', fontSize: '14px', marginTop: '16px' }}>
          <span style={{ color: 'var(--text-muted)' }}>Already have an account? </span>
          <Link to="/login" style={{ color: 'var(--color-primary)', fontWeight: 'var(--font-weight-semibold)', textDecoration: 'none' }}>
            Log In
          </Link>
        </div>
      </div>

      {showSuccessModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ textAlign: 'center', padding: '40px' }}>
            <span style={{ fontSize: '50px' }}>✨</span>
            <h3 style={{ fontSize: '24px', fontWeight: 800, marginTop: '16px', marginBottom: '12px' }}>
              Account Created Successfully!
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '15px', lineHeight: '1.6', marginBottom: '24px' }}>
              Next Step: Create employee accounts (Assistant Manager, Cashier, Server) from your dashboard so they can access the system with their assigned roles.
            </p>
            <button 
              onClick={() => {
                setShowSuccessModal(false);
                navigate('/login');
              }} 
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '14px' }}
            >
              Got it, Log In
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Signup;
