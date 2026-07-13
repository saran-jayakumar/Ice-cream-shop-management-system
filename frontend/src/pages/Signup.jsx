import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/authService';
import { useToast } from '../hooks/useToast';
import Spinner from '../components/Spinner';

const Signup = () => {
  const [name, setName] = useState('');
  const [emailPrefix, setEmailPrefix] = useState('');
  const [password, setPassword] = useState('');
  const [role] = useState('OWNER');
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [errors, setErrors] = useState({});
  
  const navigate = useNavigate();
  const { showToast } = useToast();

  const validateField = (field, value) => {
    let error = '';
    if (field === 'name') {
      if (!value) {
        error = 'Full name is required';
      } else if (value.trim().length < 3) {
        error = 'Name must be at least 3 characters';
      } else if (!/^[a-zA-Z\s]+$/.test(value)) {
        error = 'Name must only contain letters and spaces';
      }
    } else if (field === 'emailPrefix') {
      if (!value) {
        error = 'Email prefix is required';
      } else if (value.length < 3) {
        error = 'Email prefix must be at least 3 characters';
      } else if (!/^[a-z0-9._]+$/.test(value)) {
        error = 'Prefix must only contain lowercase letters, numbers, dots, or underscores';
      }
    } else if (field === 'password') {
      if (!value) {
        error = 'Password is required';
      } else if (value.length < 6) {
        error = 'Password must be at least 6 characters';
      } else if (!/(?=.*[A-Za-z])(?=.*\d)/.test(value)) {
        error = 'Password must contain at least one letter and one number';
      }
    }
    setErrors(prev => ({ ...prev, [field]: error }));
    return !error;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const isNameValid = validateField('name', name);
    const isEmailPrefixValid = validateField('emailPrefix', emailPrefix);
    const isPasswordValid = validateField('password', password);

    if (!isNameValid || !isEmailPrefixValid || !isPasswordValid) {
      showToast('Please correct the validation errors first', 'error');
      return;
    }

    const email = `${emailPrefix.trim()}@onescoop.com`;
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

        <form onSubmit={handleSubmit} autoComplete="off">
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label className="form-label" htmlFor="name-input">Full Name</label>
            <input
              type="text"
              id="name-input"
              className="input-field"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                validateField('name', e.target.value);
              }}
              required
              style={{ borderColor: errors.name ? 'var(--color-danger)' : '' }}
            />
            {errors.name && (
              <div style={{ color: 'var(--color-danger)', fontSize: '12px', marginTop: '4px' }}>
                {errors.name}
              </div>
            )}
          </div>

          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label className="form-label" htmlFor="email-input">Email Address</label>
            <div style={{ display: 'flex', alignItems: 'stretch' }}>
              <input
                type="text"
                id="email-input"
                className="input-field"
                value={emailPrefix}
                onChange={(e) => {
                  const val = e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, '');
                  setEmailPrefix(val);
                  validateField('emailPrefix', val);
                }}
                required
                autoComplete="off"
                style={{ 
                  borderTopRightRadius: 0, 
                  borderBottomRightRadius: 0, 
                  flex: 1,
                  borderColor: errors.emailPrefix ? 'var(--color-danger)' : '' 
                }}
              />
              <span style={{
                display: 'flex',
                alignItems: 'center',
                padding: '0 16px',
                background: 'var(--border-color)',
                border: '1px solid var(--border-color)',
                borderLeft: 'none',
                borderTopRightRadius: '8px',
                borderBottomRightRadius: '8px',
                color: 'var(--text-muted)',
                fontWeight: 'var(--font-weight-semibold)',
                fontSize: '14px',
                userSelect: 'none'
              }}>
                @onescoop.com
              </span>
            </div>
            {errors.emailPrefix && (
              <div style={{ color: 'var(--color-danger)', fontSize: '12px', marginTop: '4px' }}>
                {errors.emailPrefix}
              </div>
            )}
          </div>

          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label className="form-label" htmlFor="password-input">Password</label>
            <input
              type="password"
              id="password-input"
              className="input-field"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                validateField('password', e.target.value);
              }}
              required
              autoComplete="new-password"
              style={{ borderColor: errors.password ? 'var(--color-danger)' : '' }}
            />
            {errors.password && (
              <div style={{ color: 'var(--color-danger)', fontSize: '12px', marginTop: '4px' }}>
                {errors.password}
              </div>
            )}
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
