import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import StatCard from '../components/StatCard';
import Spinner from '../components/Spinner';
import { useToast } from '../hooks/useToast';
import { employeeService } from '../services/employeeService';
import { flavourService } from '../services/flavourService';
import { billService } from '../services/billService';
import { orderService } from '../services/orderService';
import { 
  TrendingUp, 
  DollarSign, 
  ShoppingBag, 
  Plus, 
  Edit3, 
  Search,
  Trash2,
  X,
  Eye,
  EyeOff
} from 'lucide-react';

const ManagerDashboard = () => {
  const getEmployeeAvatarPath = (position) => {
    if (!position) return '/server.png';
    switch (position.toUpperCase()) {
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

  const [activePage, setActivePage] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  // Data states
  const [stats, setStats] = useState({
    dailyProfit: 0.0,
    monthlyProfit: 0.0,
    yearlyProfit: 0.0,
    totalRevenue: 0.0,
    cashRevenue: 0.0,
    onlineRevenue: 0.0,
    ordersCount: 0
  });
  const [employees, setEmployees] = useState([]);
  const [flavours, setFlavours] = useState([]);
  const [orders, setOrders] = useState([]);

  // Modals state
  const [showEmpModal, setShowEmpModal] = useState(false);
  const [currentEmp, setCurrentEmp] = useState({ employeeName: '', position: 'SERVER', salary: '', shift: 'Morning' });
  const [changeEmpPassword, setChangeEmpPassword] = useState(false);
  const [showEmpPassword, setShowEmpPassword] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showFlavourModal, setShowFlavourModal] = useState(false);
  const [currentFlavour, setCurrentFlavour] = useState({ flavourName: '', price: '', availability: true, imageUrl: '' });
  const [empErrors, setEmpErrors] = useState({});

  const validateEmployeeField = (field, value, fullEmployeeObject = null) => {
    let error = '';
    const emp = fullEmployeeObject || currentEmp;

    if (field === 'employeeName') {
      if (!value) {
        error = 'Employee name is required';
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
      const isNew = !emp.id;
      const isUpdatingPassword = changeEmpPassword;
      if (isNew || isUpdatingPassword) {
        if (!value) {
          error = 'Password is required';
        } else if (value.length < 6) {
          error = 'Password must be at least 6 characters';
        } else if (!/(?=.*[A-Za-z])(?=.*\d)/.test(value)) {
          error = 'Password must contain at least one letter and one number';
        }
      }
    } else if (field === 'salary') {
      const val = parseFloat(value);
      if (isNaN(val) || val <= 0) {
        error = 'Salary must be a positive number greater than 0';
      }
    }

    setEmpErrors(prev => ({ ...prev, [field]: error }));
    return !error;
  };

  // Search filter states
  const [empSearch, setEmpSearch] = useState('');
  const [flavourSearch, setFlavourSearch] = useState('');

  // Fetch initial data
  const loadData = async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    try {
      const statsData = await billService.getReports();
      setStats(statsData);
      
      const empData = await employeeService.getAllEmployees();
      setEmployees(empData);
      
      const flavourData = await flavourService.getAllFlavours();
      setFlavours(flavourData);

      const orderData = await orderService.getAllOrders();
      setOrders(orderData);
    } catch (err) {
      if (showSpinner) {
        showToast('Error loading manager dashboard data', 'error');
      }
    } finally {
      if (showSpinner) setLoading(false);
    }
  };

  useEffect(() => {
    loadData(true);
    const interval = setInterval(() => {
      loadData(false);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Employee actions (Save/Update only, Delete is Owner restricted)
  const handleSaveEmployee = async (e) => {
    e.preventDefault();

    const emailPrefix = (currentEmp.user?.email || '').replace('@onescoop.com', '');
    const password = currentEmp.user?.password || '';

    const isNameValid = validateEmployeeField('employeeName', currentEmp.employeeName);
    const isEmailValid = validateEmployeeField('emailPrefix', emailPrefix);
    const isPasswordValid = validateEmployeeField('password', password);
    const isSalaryValid = validateEmployeeField('salary', currentEmp.salary);

    if (!isNameValid || !isEmailValid || !isPasswordValid || !isSalaryValid) {
      showToast('Please correct the validation errors first', 'error');
      return;
    }

    setLoading(true);
    const payload = {
      ...currentEmp,
      user: currentEmp.user ? {
        ...currentEmp.user,
        password: (changeEmpPassword || !currentEmp.id) && currentEmp.user.password ? currentEmp.user.password : null
      } : null
    };

    try {
      if (currentEmp.id) {
        await employeeService.updateEmployee(currentEmp.id, payload);
        showToast('Employee updated successfully', 'success');
      } else {
        await employeeService.createEmployee(payload);
        showToast('Employee added successfully', 'success');
      }
      setShowEmpModal(false);
      setShowEmpPassword(false);
      loadData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Error saving employee record', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEmployee = async (id) => {
    if (!confirm('Are you sure you want to delete this employee?')) return;
    setLoading(true);
    try {
      await employeeService.deleteEmployee(id);
      showToast('Employee deleted successfully', 'success');
      loadData();
    } catch (err) {
      showToast('Error deleting employee record', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFlavourImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCurrentFlavour({
          ...currentFlavour,
          imageUrl: reader.result
        });
      };
      reader.readAsDataURL(file);
    }
  };

  // Flavour actions (CRUD allowed for AM)
  const handleSaveFlavour = async (e) => {
    e.preventDefault();
    const isDuplicate = flavours.some(f => f.flavourName.trim().toLowerCase() === currentFlavour.flavourName.trim().toLowerCase() && f.id !== currentFlavour.id);
    if (isDuplicate) {
      showToast('Flavour name already exists', 'error');
      return;
    }
    setLoading(true);
    try {
      if (currentFlavour.id) {
        await flavourService.updateFlavour(currentFlavour.id, currentFlavour);
        showToast('Flavour updated successfully', 'success');
      } else {
        await flavourService.createFlavour(currentFlavour);
        showToast('Flavour added successfully', 'success');
      }
      setShowFlavourModal(false);
      loadData();
    } catch (err) {
      const errMsg = err.response?.data?.message || err.response?.data || 'Error saving flavor';
      showToast(errMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFlavour = async (id) => {
    if (!window.confirm('Do you want to delete this flavour?')) return;
    setLoading(true);
    try {
      await flavourService.deleteFlavour(id);
      showToast('Flavour deleted successfully', 'success');
      loadData();
    } catch (err) {
      const errMsg = err.response?.data?.message || err.response?.data || '';
      if (errMsg.toLowerCase().includes('integrity') || errMsg.toLowerCase().includes('foreign key') || errMsg.toLowerCase().includes('delete') || err.message?.toLowerCase().includes('status code 500') || err.response?.status === 500) {
        showToast('Cannot delete this flavour because it is linked to past order history. Please disable its availability instead.', 'error');
      } else {
        showToast(errMsg || 'Error deleting flavor', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  // Filter lists
  const filteredEmployees = employees.filter(emp => 
    emp.employeeName.toLowerCase().includes(empSearch.toLowerCase()) ||
    emp.position.toLowerCase().includes(empSearch.toLowerCase())
  );

  const filteredFlavours = flavours.filter(flav => 
    flav.flavourName.toLowerCase().includes(flavourSearch.toLowerCase())
  );

  return (
    <div className="app-container">
      <Spinner show={loading} />
      <Sidebar activePage={activePage} setActivePage={setActivePage} />
      
      <div className="main-content">
        {activePage === 'dashboard' && (
          <>
            <Header title="Manager Reports" />
            
            <div className="dashboard-grid">
              <StatCard 
                title="Daily Profit" 
                value={`₹${stats.dailyProfit.toFixed(2)}`} 
                icon={<img src="/daily-profit.png" alt="Daily Profit" style={{ width: '28px', height: '28px', objectFit: 'contain' }} />} 
                colorClass="icon-green"
              />
              <StatCard 
                title="Monthly Profit" 
                value={`₹${stats.monthlyProfit.toFixed(2)}`} 
                icon={<img src="/monthly-profit.png" alt="Monthly Profit" style={{ width: '28px', height: '28px', objectFit: 'contain' }} />} 
                colorClass="icon-blue"
              />
              <StatCard 
                title="Total Revenue" 
                value={`₹${stats.totalRevenue.toFixed(2)}`} 
                icon={<img src="/total-revenue.png" alt="Total Revenue" style={{ width: '28px', height: '28px', objectFit: 'contain' }} />} 
                colorClass="icon-orange"
              />
              <StatCard 
                title="Cash Sales" 
                value={`₹${(stats.cashRevenue || 0.0).toFixed(2)}`} 
                icon={<img src="/cash-sales.png" alt="Cash Sales" style={{ width: '28px', height: '28px', objectFit: 'contain' }} />} 
                colorClass="icon-green"
              />
              <StatCard 
                title="Online Sales" 
                value={`₹${(stats.onlineRevenue || 0.0).toFixed(2)}`} 
                icon={<img src="/online-sales.png" alt="Online Sales" style={{ width: '28px', height: '28px', objectFit: 'contain' }} />} 
                colorClass="icon-blue"
              />
              <StatCard 
                title="Today's Orders" 
                value={stats.ordersCount} 
                icon={<img src="/total-orders.png" alt="Total Orders" style={{ width: '28px', height: '28px', objectFit: 'contain' }} />} 
                colorClass="icon-pink"
              />
            </div>

            <div className="card" style={{ marginTop: '24px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '16px' }}>Shift Details & Roster</h3>
              <div className="table-container">
                <table className="premium-table">
                  <thead>
                    <tr>
                      <th>Employee Name</th>
                      <th>Work Position</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees.map((emp) => (
                      <tr key={emp.id}>
                        <td style={{ fontWeight: 600 }}>{emp.employeeName}</td>
                        <td><span className="badge badge-info">{emp.position}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {activePage === 'employees' && (
          <>
            <Header title="Crew Shift Management" />
            
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
                <input
                  type="text"
                  className="input-field"
                  style={{ width: '100%', paddingLeft: '40px' }}
                  placeholder="Search by name or position..."
                  value={empSearch}
                  onChange={(e) => setEmpSearch(e.target.value)}
                />
                <Search size={18} style={{ position: 'absolute', left: '14px', top: '16px', color: 'var(--text-muted)' }} />
              </div>
              <button 
                onClick={() => {
                  setCurrentEmp({ employeeName: '', position: 'SERVER', salary: '', shift: 'Morning', user: { email: '', password: '' } });
                  setChangeEmpPassword(true);
                  setShowEmpPassword(false);
                  setShowOldPassword(false);
                  setEmpErrors({});
                  setShowEmpModal(true);
                }} 
                className="btn btn-primary"
              >
                <Plus size={18} />
                <span>Add Employee</span>
              </button>
            </div>

            <div className="table-container">
              <table className="premium-table">
                <thead>
                  <tr>
                    <th style={{ width: '60px' }}>Avatar</th>
                    <th>Name</th>
                    <th>Position</th>
                    <th>Login Account</th>
                    <th>Salary (₹ / Mo)</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEmployees.map((emp) => (
                    <tr key={emp.id}>
                      <td>
                        <img 
                          src={getEmployeeAvatarPath(emp.position)} 
                          alt={emp.employeeName} 
                          style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border-color)', display: 'block' }} 
                        />
                      </td>
                      <td style={{ fontWeight: 600 }}>{emp.employeeName}</td>
                      <td><span className="badge badge-info">{emp.position}</span></td>
                      <td>
                        {emp.user ? (
                          <code style={{ fontSize: '13px', background: 'rgba(245, 163, 183, 0.08)', padding: '2px 6px', borderRadius: '4px' }}>
                            {emp.user.email}
                          </code>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No Login</span>
                        )}
                      </td>
                      <td>₹{emp.salary.toFixed(2)}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                          <button 
                            onClick={() => {
                              setCurrentEmp({ ...emp, user: emp.user || { email: '', password: '' } });
                              setChangeEmpPassword(false);
                              setShowEmpPassword(false);
                              setShowOldPassword(false);
                              setEmpErrors({});
                              setShowEmpModal(true);
                            }} 
                            className="btn btn-secondary" 
                            style={{ padding: '6px 12px', fontSize: '13px' }}
                          >
                            <Edit3 size={14} />
                          </button>
                          <button 
                            onClick={() => handleDeleteEmployee(emp.id)} 
                            className="btn btn-danger" 
                            style={{ padding: '6px 12px', fontSize: '13px' }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredEmployees.length === 0 && (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                        No employees found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {showEmpModal && (
              <div className="modal-overlay">
                <div className="modal-content">
                  <div className="modal-header">
                    <h3 className="modal-title">{currentEmp.id ? 'Modify Crew Profile' : 'Register New Crew'}</h3>
                    <button className="modal-close" onClick={() => setShowEmpModal(false)}><X /></button>
                  </div>
                  <form onSubmit={handleSaveEmployee}>
                    <div className="form-group">
                      <label className="form-label" htmlFor="m-emp-name">Employee Name</label>
                      <input
                        type="text"
                        id="m-emp-name"
                        className="input-field"
                        value={currentEmp.employeeName}
                        onChange={(e) => {
                          setCurrentEmp({ ...currentEmp, employeeName: e.target.value });
                          validateEmployeeField('employeeName', e.target.value);
                        }}
                        required
                        style={{ borderColor: empErrors.employeeName ? 'var(--color-danger)' : '' }}
                      />
                      {empErrors.employeeName && (
                        <div style={{ color: 'var(--color-danger)', fontSize: '12px', marginTop: '4px' }}>
                          {empErrors.employeeName}
                        </div>
                      )}
                    </div>
                    <div className="form-group">
                      <label className="form-label" htmlFor="m-emp-pos">Position</label>
                      <select
                        id="m-emp-pos"
                        className="input-field"
                        value={currentEmp.position}
                        onChange={(e) => setCurrentEmp({ ...currentEmp, position: e.target.value })}
                      >
                        <option value="SERVER">Server</option>
                        <option value="CASHIER">Cashier</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label" htmlFor="m-emp-email">Login Email (ID)</label>
                      <div style={{ display: 'flex', alignItems: 'stretch' }}>
                        <input
                          type="text"
                          id="m-emp-email"
                          className="input-field"
                          autoComplete="off"
                          value={(currentEmp.user?.email || '').replace(/@.*$/, '')}
                          onChange={(e) => {
                            const val = e.target.value.trim().toLowerCase().replace(/[^a-z0-9._]/g, '');
                            setCurrentEmp({
                              ...currentEmp,
                              user: { ...currentEmp.user, email: val ? `${val}@onescoop.com` : '' }
                            });
                            validateEmployeeField('emailPrefix', val);
                          }}
                          required
                          style={{ 
                            borderTopRightRadius: 0, 
                            borderBottomRightRadius: 0, 
                            flex: 1,
                            borderColor: empErrors.emailPrefix ? 'var(--color-danger)' : '' 
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
                      {empErrors.emailPrefix && (
                        <div style={{ color: 'var(--color-danger)', fontSize: '12px', marginTop: '4px' }}>
                          {empErrors.emailPrefix}
                        </div>
                      )}
                    </div>
                    {currentEmp.id ? (
                      !changeEmpPassword ? (
                        <div className="form-group" style={{ marginTop: '16px' }}>
                          <label className="form-label">Password</label>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--bg-app)', padding: '10px 16px', borderRadius: 'var(--radius-md)', border: 'var(--glass-border)' }}>
                            <span style={{ 
                              fontFamily: showOldPassword ? 'var(--font-sans)' : 'monospace', 
                              letterSpacing: showOldPassword ? 'normal' : '4px', 
                              color: showOldPassword ? 'var(--text-main)' : 'var(--text-muted)', 
                              fontSize: '15px', 
                              flex: 1 
                            }}>
                              {showOldPassword ? (currentEmp.user?.plainTextPassword || 'No password set') : '••••••••'}
                            </span>
                            <button 
                              type="button" 
                              onClick={() => setShowOldPassword(!showOldPassword)} 
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px', display: 'flex', alignItems: 'center' }}
                            >
                              {showOldPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                            <button 
                              type="button" 
                              className="btn" 
                              onClick={() => setChangeEmpPassword(true)}
                              style={{ 
                                padding: '8px 16px', 
                                background: 'rgba(255, 126, 157, 0.1)', 
                                color: 'var(--color-primary)', 
                                border: '1px solid var(--color-primary)', 
                                fontWeight: 700, 
                                fontSize: '13px',
                                cursor: 'pointer' 
                              }}
                            >
                              Update Password
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="form-group" style={{ marginTop: '16px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                            <label className="form-label" htmlFor="emp-password" style={{ margin: 0 }}>New Password</label>
                            <button 
                              type="button" 
                              style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontSize: '12px', cursor: 'pointer', fontWeight: 600 }}
                              onClick={() => {
                                setChangeEmpPassword(false);
                                setEmpErrors(prev => ({ ...prev, password: '' }));
                                setCurrentEmp(prev => ({
                                  ...prev,
                                  user: { ...prev.user, password: '' }
                                }));
                              }}
                            >
                              Cancel Update
                            </button>
                          </div>
                          <div style={{ position: 'relative' }}>
                            <input
                              type={showEmpPassword ? 'text' : 'password'}
                              id="emp-password"
                              className="input-field"
                              value={currentEmp.user?.password || ''}
                              onChange={(e) => {
                                setCurrentEmp({
                                  ...currentEmp,
                                  user: { ...currentEmp.user, password: e.target.value }
                                });
                                validateEmployeeField('password', e.target.value);
                              }}
                              style={{ width: '100%', paddingRight: '44px', borderColor: empErrors.password ? 'var(--color-danger)' : '' }}
                              required
                              autoComplete="new-password"
                            />
                            <button 
                              type="button" 
                              onClick={() => setShowEmpPassword(!showEmpPassword)} 
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
                              {showEmpPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                          </div>
                          {empErrors.password && (
                            <div style={{ color: 'var(--color-danger)', fontSize: '12px', marginTop: '4px' }}>
                              {empErrors.password}
                            </div>
                          )}
                        </div>
                      )
                    ) : (
                      <div className="form-group" style={{ marginTop: '16px' }}>
                        <label className="form-label" htmlFor="emp-password">Password</label>
                        <div style={{ position: 'relative' }}>
                          <input
                            type={showEmpPassword ? 'text' : 'password'}
                            id="emp-password"
                            className="input-field"
                            value={currentEmp.user?.password || ''}
                            onChange={(e) => {
                              setCurrentEmp({
                                ...currentEmp,
                                user: { ...currentEmp.user, password: e.target.value }
                              });
                              validateEmployeeField('password', e.target.value);
                            }}
                            style={{ width: '100%', paddingRight: '44px', borderColor: empErrors.password ? 'var(--color-danger)' : '' }}
                            required
                            autoComplete="new-password"
                          />
                          <button 
                            type="button" 
                            onClick={() => setShowEmpPassword(!showEmpPassword)} 
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
                            {showEmpPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                        {empErrors.password && (
                          <div style={{ color: 'var(--color-danger)', fontSize: '12px', marginTop: '4px' }}>
                            {empErrors.password}
                          </div>
                        )}
                      </div>
                    )}
                    <div className="form-group">
                      <label className="form-label" htmlFor="m-emp-sal">Monthly Salary (₹)</label>
                      <input
                        type="number"
                        id="m-emp-sal"
                        className="input-field"
                        value={currentEmp.salary}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCurrentEmp({ ...currentEmp, salary: val === '' ? '' : parseFloat(val) });
                          validateEmployeeField('salary', val);
                        }}
                        required
                        style={{ borderColor: empErrors.salary ? 'var(--color-danger)' : '' }}
                      />
                      {empErrors.salary && (
                        <div style={{ color: 'var(--color-danger)', fontSize: '12px', marginTop: '4px' }}>
                          {empErrors.salary}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                      <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowEmpModal(false)}>Cancel</button>
                      <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>Save changes</button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </>
        )}

        {activePage === 'flavours' && (
          <>
            <Header title="Flavour Catalog" />
            
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
                <input
                  type="text"
                  className="input-field"
                  style={{ width: '100%', paddingLeft: '40px' }}
                  placeholder="Search flavors..."
                  value={flavourSearch}
                  onChange={(e) => setFlavourSearch(e.target.value)}
                />
                <Search size={18} style={{ position: 'absolute', left: '14px', top: '16px', color: 'var(--text-muted)' }} />
              </div>
              <button onClick={() => {
                setCurrentFlavour({ flavourName: '', price: '', availability: true, imageUrl: '' });
                setShowFlavourModal(true);
              }} className="btn btn-primary">
                <Plus size={18} />
                <span>Add Flavour</span>
              </button>
            </div>

            <div className="table-container">
              <table className="premium-table">
                <thead>
                  <tr>
                    <th style={{ width: '60px' }}>Image</th>
                    <th>Flavour Name</th>
                    <th>Price (₹ / Scoop)</th>
                    <th>Availability</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFlavours.map((flav) => (
                    <tr key={flav.id}>
                      <td>
                        {flav.imageUrl ? (
                          <img 
                            src={flav.imageUrl} 
                            alt={flav.flavourName} 
                            style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '6px', border: '1px solid var(--border-color)' }} 
                          />
                        ) : (
                          <div style={{ width: '40px', height: '40px', background: 'var(--bg-app)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '6px', fontSize: '18px' }}>
                            🍦
                          </div>
                        )}
                      </td>
                      <td style={{ fontWeight: 600 }}>{flav.flavourName}</td>
                      <td>₹{flav.price.toFixed(2)}</td>
                      <td>
                        <span className={`badge ${flav.availability ? 'badge-success' : 'badge-danger'}`}>
                          {flav.availability ? 'IN STOCK' : 'OUT OF STOCK'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                          <button onClick={() => {
                            setCurrentFlavour({ ...flav, imageUrl: flav.imageUrl || '' });
                            setShowFlavourModal(true);
                          }} className="btn btn-secondary" style={{ padding: '6px 12px' }}>
                            <Edit3 size={14} />
                          </button>
                          <button onClick={() => handleDeleteFlavour(flav.id)} className="btn btn-danger" style={{ padding: '6px 12px' }}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {showFlavourModal && (
              <div className="modal-overlay">
                <div className="modal-content">
                  <div className="modal-header">
                    <h3 className="modal-title">{currentFlavour.id ? 'Edit Scoop Details' : 'Add New Flavor Scoop'}</h3>
                    <button className="modal-close" onClick={() => setShowFlavourModal(false)}><X /></button>
                  </div>
                  <form onSubmit={handleSaveFlavour}>
                    <div className="form-group">
                      <label className="form-label" htmlFor="m-flav-name">Flavour Name</label>
                      <input
                        type="text"
                        id="m-flav-name"
                        className="input-field"
                        value={currentFlavour.flavourName}
                        onChange={(e) => setCurrentFlavour({ ...currentFlavour, flavourName: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Flavour Image</label>
                      <input
                        type="file"
                        accept="image/*"
                        className="input-field"
                        onChange={handleFlavourImageChange}
                        style={{ padding: '8px' }}
                      />
                      {currentFlavour.imageUrl && (
                        <div style={{ marginTop: '12px', textAlign: 'center' }}>
                          <img 
                            src={currentFlavour.imageUrl} 
                            alt="Preview" 
                            style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }} 
                          />
                          <button 
                            type="button" 
                            className="btn btn-secondary" 
                            style={{ padding: '4px 8px', fontSize: '12px', marginTop: '6px', display: 'block', margin: '6px auto 0 auto' }}
                            onClick={() => setCurrentFlavour({ ...currentFlavour, imageUrl: '' })}
                          >
                            Remove Image
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="form-group">
                      <label className="form-label" htmlFor="m-flav-price">Price Per Scoop (₹)</label>
                      <input
                        type="number"
                        id="m-flav-price"
                        step="0.01"
                        className="input-field"
                        value={currentFlavour.price}
                        onChange={(e) => setCurrentFlavour({ ...currentFlavour, price: parseFloat(e.target.value) })}
                        required
                      />
                    </div>
                    <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '12px', marginTop: '12px' }}>
                      <input
                        type="checkbox"
                        id="m-flav-avail"
                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                        checked={currentFlavour.availability}
                        onChange={(e) => setCurrentFlavour({ ...currentFlavour, availability: e.target.checked })}
                      />
                      <label className="form-label" htmlFor="m-flav-avail" style={{ margin: 0, cursor: 'pointer' }}>Available</label>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                      <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowFlavourModal(false)}>Cancel</button>
                      <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>Save Flavor</button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </>
        )}

        {activePage === 'orders' && (
          <>
            <Header title="Daily Sales Log" />
            <div className="table-container" style={{ marginTop: '24px' }}>
              <table className="premium-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Table Number</th>
                    <th>Server Name</th>
                    <th>Total Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id}>
                      <td style={{ fontWeight: 600 }}>#ORD-{order.id}</td>
                      <td>Table {order.table.tableNumber}</td>
                      <td>{order.server?.name || 'Server'}</td>
                      <td>₹{order.totalAmount.toFixed(2)}</td>
                      <td>
                        <span className={`badge ${order.orderStatus === 'COMPLETED' ? 'badge-success' : 'badge-pending'}`}>
                          {order.orderStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {orders.length === 0 && (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                        No orders recorded today.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ManagerDashboard;
