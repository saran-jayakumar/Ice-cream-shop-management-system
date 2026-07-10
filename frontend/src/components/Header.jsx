import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { useToast } from '../hooks/useToast';
import { User, Sun, Moon, LogOut, Eye, EyeOff, X, Trash2 } from 'lucide-react';

const Header = ({ title }) => {
  const user = authService.getCurrentUser();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [showDropdown, setShowDropdown] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  
  // Profile loading & detail states
  const [profileDetails, setProfileDetails] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  // Profile fields state
  const [editName, setEditName] = useState(user?.name || '');
  const [editPassword, setEditPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Theme states
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  });

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  // Load details when modal opens
  useEffect(() => {
    if (showProfileModal) {
      const fetchProfile = async () => {
        setLoadingProfile(true);
        try {
          const details = await authService.getCurrentUserDetails();
          setProfileDetails(details);
          setEditName(details.name);
        } catch (err) {
          showToast('Failed to load profile details', 'error');
        } finally {
          setLoadingProfile(false);
        }
      };
      fetchProfile();
    }
  }, [showProfileModal]);

  if (!user) return null;

  const getAvatarPath = (role) => {
    if (!role) return '/server.png';
    switch (role.toUpperCase()) {
      case 'OWNER':
        return '/owner.png';
      case 'ASSISTANT_MANAGER':
        return '/manager.png';
      case 'CASHIER':
        return '/cashier.png';
      case 'SERVER':
      default:
        return '/server.png';
    }
  };

  const getRoleDisplayName = (role) => {
    return role.replace('_', ' ');
  };

  const handleToggleTheme = (e) => {
    e.stopPropagation();
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    localStorage.setItem('theme', nextTheme);
    showToast(`Switched to ${nextTheme === 'dark' ? 'Dark' : 'Light'} theme`, 'info');
    setShowDropdown(false);
  };

  const handleLogout = () => {
    authService.logout();
    showToast('Logged out successfully', 'info');
    navigate('/login');
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      await authService.updateProfile(editName, editPassword);
      showToast('Profile updated successfully!', 'success');
      setShowProfileModal(false);
      setEditPassword('');
      window.location.reload();
    } catch (err) {
      showToast('Error updating profile details', 'error');
    }
  };

  const handleDeleteAccount = async () => {
    const confirmMessage = user.role.toUpperCase() === 'OWNER'
      ? "WARNING: Deleting your owner account will permanently delete your entire shop data, including all flavours, tables, bills, orders, employees, and settings. This cannot be undone!\n\nAre you sure you want to proceed?"
      : "Are you sure you want to permanently delete your account? This cannot be undone!";

    if (window.confirm(confirmMessage)) {
      try {
        await authService.deleteAccount();
        showToast('Your account was deleted successfully.', 'info');
        navigate('/login');
      } catch (err) {
        showToast(err.response?.data || 'Failed to delete account.', 'error');
      }
    }
  };

  return (
    <div className="header-container" id="app-header" style={{ position: 'relative' }}>
      <div>
        <h1 style={{ fontSize: '28px', fontWeight: 800 }}>{title}</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
          Welcome back to One Scoop shop management
        </p>
      </div>

      <div 
        className="user-profile" 
        style={{ position: 'relative', cursor: 'pointer', zIndex: 100 }} 
        onClick={() => setShowDropdown(!showDropdown)}
      >
        <div className="user-info" style={{ textAlign: 'right' }}>
          <span className="user-name">{user.name}</span>
          <span className="user-role-badge">{getRoleDisplayName(user.role)}</span>
        </div>
        <div className="user-avatar" style={{ padding: '2px', background: 'var(--glass-border)' }}>
          <img 
            src={getAvatarPath(user.role)} 
            alt={user.name} 
            style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} 
          />
        </div>

        {showDropdown && (
          <div className="profile-dropdown" onClick={(e) => e.stopPropagation()}>
            <button className="dropdown-item" onClick={() => { setShowProfileModal(true); setShowDropdown(false); }}>
              <User size={16} />
              <span>My Profile</span>
            </button>
            <button className="dropdown-item" onClick={handleToggleTheme}>
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
              <span>{theme === 'dark' ? 'Light Theme' : 'Dark Theme'}</span>
            </button>
            <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '4px 0' }} />
            <button className="dropdown-item dropdown-item-danger" onClick={handleLogout} style={{ color: '#ef5350' }}>
              <LogOut size={16} />
              <span>Log Out</span>
            </button>
          </div>
        )}
      </div>

      {showProfileModal && (
        <div className="modal-overlay" style={{ zIndex: 200 }} onClick={() => setShowProfileModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">My Profile</h3>
              <button className="modal-close" onClick={() => setShowProfileModal(false)}><X /></button>
            </div>
            
            {loadingProfile ? (
              <div style={{ textAlign: 'center', padding: '20px', fontWeight: 600 }}>Loading profile...</div>
            ) : (user?.role && user.role.toUpperCase() === 'OWNER') ? (
              <form onSubmit={handleUpdateProfile}>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    value={editName} 
                    onChange={(e) => setEditName(e.target.value)} 
                    required 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input 
                    type="email" 
                    className="input-field" 
                    value={user.email} 
                    disabled 
                    style={{ opacity: 0.6, cursor: 'not-allowed' }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Password</label>
                  <div style={{ position: 'relative' }}>
                    <input 
                      type={showPassword ? 'text' : 'password'} 
                      className="input-field" 
                      placeholder="••••••••" 
                      value={editPassword} 
                      onChange={(e) => setEditPassword(e.target.value)} 
                      style={{ width: '100%', paddingRight: '44px' }}
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)} 
                      style={{ 
                        position: 'absolute', 
                        right: '12px', 
                        top: '14px', 
                        background: 'none', 
                        border: 'none', 
                        cursor: 'pointer', 
                        color: 'var(--text-muted)' 
                      }}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <small style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '4px' }}>
                    Leave blank to keep your current password. Type here to change it.
                  </small>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                  <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowProfileModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>Save changes</button>
                </div>

                <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '24px', paddingTop: '16px' }}>
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={handleDeleteAccount}
                    style={{ 
                      width: '100%', 
                      background: 'rgba(239, 83, 80, 0.1)', 
                      color: '#ef5350', 
                      border: '1px solid rgba(239, 83, 80, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    <Trash2 size={16} />
                    <span>Delete Account</span>
                  </button>
                </div>
              </form>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', background: 'rgba(255, 126, 157, 0.05)', borderRadius: 'var(--radius-md)', border: 'var(--glass-border)' }}>
                  <img 
                    src={getAvatarPath(user.role)} 
                    alt={user.name} 
                    style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover' }} 
                  />
                  <div>
                    <h4 style={{ fontSize: '18px', fontWeight: 800 }}>{profileDetails?.name || user.name}</h4>
                    <span className="user-role-badge" style={{ marginTop: '4px' }}>{getRoleDisplayName(user.role)}</span>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    value={profileDetails?.email || user.email} 
                    disabled 
                    style={{ opacity: 0.8, cursor: 'not-allowed' }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Monthly Salary</label>
                  <div className="input-field" style={{ background: 'var(--bg-app)', fontWeight: 700, fontSize: '16px', color: 'var(--color-primary)' }}>
                    ₹{profileDetails?.salary !== undefined && profileDetails?.salary !== null ? profileDetails.salary.toFixed(2) : '0.00'}
                  </div>
                </div>

                <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <button 
                    type="button" 
                    className="btn btn-primary" 
                    style={{ width: '100%', justifyContent: 'center' }} 
                    onClick={() => setShowProfileModal(false)}
                  >
                    Close Profile
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={handleDeleteAccount}
                    style={{ 
                      width: '100%', 
                      background: 'rgba(239, 83, 80, 0.1)', 
                      color: '#ef5350', 
                      border: '1px solid rgba(239, 83, 80, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    <Trash2 size={16} />
                    <span>Delete Account</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Header;
