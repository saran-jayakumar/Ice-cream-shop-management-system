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
  Users, 
  Plus, 
  Trash2, 
  Edit3, 
  Search,
  Check,
  X,
  Eye,
  EyeOff
} from 'lucide-react';

const OwnerDashboard = () => {
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
  const [bills, setBills] = useState([]);
  const [orders, setOrders] = useState([]);

  // Modals state
  const [showEmpModal, setShowEmpModal] = useState(false);
  const [currentEmp, setCurrentEmp] = useState({ employeeName: '', position: 'SERVER', salary: '', shift: 'Morning' });
  const [changeEmpPassword, setChangeEmpPassword] = useState(false);
  const [showEmpPassword, setShowEmpPassword] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showFlavourModal, setShowFlavourModal] = useState(false);
  const [currentFlavour, setCurrentFlavour] = useState({ flavourName: '', price: '', availability: true, imageUrl: '' });

  // Search filter states
  const [empSearch, setEmpSearch] = useState('');
  const [flavourSearch, setFlavourSearch] = useState('');
  const [billSearch, setBillSearch] = useState('');

  // Fetch initial data
  const loadData = async () => {
    setLoading(true);
    try {
      const statsData = await billService.getReports();
      setStats(statsData);
      
      const empData = await employeeService.getAllEmployees();
      setEmployees(empData);
      
      const flavourData = await flavourService.getAllFlavours();
      setFlavours(flavourData);

      const billData = await billService.getAllBills();
      setBills(billData);

      const orderData = await orderService.getAllOrders();
      setOrders(orderData);
    } catch (err) {
      showToast('Error loading shop data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // CRUD Employee actions
  const handleSaveEmployee = async (e) => {
    e.preventDefault();
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
      showToast('Error saving employee record', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEmployee = async (id) => {
    if (!window.confirm('Are you sure you want to remove this employee?')) return;
    setLoading(true);
    try {
      await employeeService.deleteEmployee(id);
      showToast('Employee deleted successfully', 'success');
      loadData();
    } catch (err) {
      showToast('Error removing employee record', 'error');
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

  // CRUD Flavour actions
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

  // Calculate Server Performance: orders handled by each server
  const getServerPerformance = () => {
    const perfMap = {};
    orders.forEach(order => {
      const serverName = order.server?.name || 'Unknown';
      if (!perfMap[serverName]) {
        perfMap[serverName] = { count: 0, amount: 0.0 };
      }
      perfMap[serverName].count += 1;
      perfMap[serverName].amount += order.totalAmount;
    });

    return Object.keys(perfMap).map(name => ({
      name,
      ordersHandled: perfMap[name].count,
      totalSales: perfMap[name].amount
    }));
  };

  const getPayrollByCategory = () => {
    const categories = {
      ASSISTANT_MANAGER: { count: 0, total: 0, label: 'Assistant Manager' },
      CASHIER: { count: 0, total: 0, label: 'Cashier' },
      SERVER: { count: 0, total: 0, label: 'Server' }
    };

    employees.forEach(emp => {
      const pos = emp.position || 'SERVER';
      if (categories[pos]) {
        categories[pos].count += 1;
        categories[pos].total += emp.salary || 0;
      } else {
        if (!categories[pos]) {
          categories[pos] = { count: 0, total: 0, label: pos.charAt(0) + pos.slice(1).toLowerCase().replace('_', ' ') };
        }
        categories[pos].count += 1;
        categories[pos].total += emp.salary || 0;
      }
    });

    return Object.values(categories).filter(c => c.count > 0);
  };

  // Filters
  const filteredEmployees = employees.filter(emp => 
    emp.employeeName.toLowerCase().includes(empSearch.toLowerCase()) ||
    emp.position.toLowerCase().includes(empSearch.toLowerCase())
  );

  const filteredFlavours = flavours.filter(flav => 
    flav.flavourName.toLowerCase().includes(flavourSearch.toLowerCase())
  );

  const filteredBills = bills.filter(bill => 
    bill.order.table.tableNumber.toString().includes(billSearch) ||
    bill.paymentStatus.toLowerCase().includes(billSearch.toLowerCase())
  );

  return (
    <div className="app-container">
      <Spinner show={loading} />
      <Sidebar activePage={activePage} setActivePage={setActivePage} />
      
      <div className="main-content">
        {activePage === 'dashboard' && (
          <>
            <Header title="Owner Insights" />
            
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
                title="Total Orders" 
                value={stats.ordersCount} 
                icon={<img src="/total-orders.png" alt="Total Orders" style={{ width: '28px', height: '28px', objectFit: 'contain' }} />} 
                colorClass="icon-pink"
              />
            </div>

            {/* Server Performance Section */}
            <div className="card" style={{ marginTop: '24px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '16px' }}>Server Performance Log</h3>
              <div className="table-container">
                <table className="premium-table">
                  <thead>
                    <tr>
                      <th>Server Name</th>
                      <th>Orders Handled</th>
                      <th>Sales Driven (₹)</th>
                      <th>Efficiency Level</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getServerPerformance().map((perf, index) => (
                      <tr key={index}>
                        <td style={{ fontWeight: 600 }}>{perf.name}</td>
                        <td>{perf.ordersHandled}</td>
                        <td>₹{perf.totalSales.toFixed(2)}</td>
                        <td>
                          <span className={`badge ${perf.ordersHandled > 5 ? 'badge-success' : 'badge-info'}`}>
                            {perf.ordersHandled > 5 ? 'EXCELLENT' : 'STANDARD'}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {getServerPerformance().length === 0 && (
                      <tr>
                        <td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                          No orders processed yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

             {/* Labor Details Summary */}
            <div className="card" style={{ marginTop: '24px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '16px' }}>Labor & Payroll Summary</h3>
              
              {/* Category-wise Breakdown */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '20px' }}>
                {getPayrollByCategory().map((cat, idx) => (
                  <div key={idx} style={{ padding: '16px', background: 'var(--bg-app)', borderRadius: 'var(--radius-md)', border: 'var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>{cat.label}s</span>
                      <div style={{ fontSize: '20px', fontWeight: 700, marginTop: '4px', color: 'var(--text-main)' }}>₹{cat.total.toFixed(2)}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span className="badge badge-info" style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '12px' }}>
                        {cat.count} {cat.count === 1 ? 'staff' : 'staffs'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total Payroll Summary */}
              <div style={{ padding: '18px 24px', background: 'rgba(255, 126, 157, 0.05)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--color-primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--text-main)' }}>Total Store Payroll</h4>
                  <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>Aggregate of all active crew payroll costs</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '28px', fontWeight: 900, color: 'var(--color-primary)' }}>
                    ₹{employees.reduce((acc, curr) => acc + curr.salary, 0).toFixed(2)}
                  </div>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>{employees.length} Active Members</span>
                </div>
              </div>
            </div>
          </>
        )}

        {activePage === 'employees' && (
          <>
            <Header title="Employee Directory" />
            
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
                      <td>
                        <span className="badge badge-info">{emp.position}</span>
                      </td>
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
                      <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                        No employees found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Employee Add/Edit Modal */}
            {showEmpModal && (
              <div className="modal-overlay">
                <div className="modal-content">
                  <div className="modal-header">
                    <h3 className="modal-title">{currentEmp.id ? 'Modify Employee Profile' : 'Register New Employee'}</h3>
                    <button className="modal-close" onClick={() => setShowEmpModal(false)}><X /></button>
                  </div>
                  <form onSubmit={handleSaveEmployee}>
                    <div className="form-group">
                      <label className="form-label" htmlFor="emp-name">Employee Name</label>
                      <input
                        type="text"
                        id="emp-name"
                        className="input-field"
                        value={currentEmp.employeeName}
                        onChange={(e) => setCurrentEmp({ ...currentEmp, employeeName: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label" htmlFor="emp-pos">Role Position</label>
                      <select
                        id="emp-pos"
                        className="input-field"
                        value={currentEmp.position}
                        onChange={(e) => setCurrentEmp({ ...currentEmp, position: e.target.value })}
                      >
                        <option value="SERVER">Server</option>
                        <option value="CASHIER">Cashier</option>
                        <option value="ASSISTANT_MANAGER">Assistant Manager</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label" htmlFor="emp-email">Login Email (ID)</label>
                      <input
                        type="email"
                        id="emp-email"
                        className="input-field"
                        placeholder="e.g. name@onescoop.com"
                        autoComplete="off"
                        value={currentEmp.user?.email || ''}
                        onChange={(e) => setCurrentEmp({
                          ...currentEmp,
                          user: { ...currentEmp.user, email: e.target.value }
                        })}
                        required
                      />
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
                              placeholder="Type new password"
                              value={currentEmp.user?.password || ''}
                              onChange={(e) => setCurrentEmp({
                                ...currentEmp,
                                user: { ...currentEmp.user, password: e.target.value }
                              })}
                              style={{ width: '100%', paddingRight: '44px' }}
                              required
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
                            placeholder="Type password"
                            value={currentEmp.user?.password || ''}
                            onChange={(e) => setCurrentEmp({
                              ...currentEmp,
                              user: { ...currentEmp.user, password: e.target.value }
                            })}
                            style={{ width: '100%', paddingRight: '44px' }}
                            required
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
                      </div>
                    )}
                    <div className="form-group">
                      <label className="form-label" htmlFor="emp-sal">Monthly Salary (₹)</label>
                      <input
                        type="number"
                        id="emp-sal"
                        className="input-field"
                        value={currentEmp.salary}
                        onChange={(e) => setCurrentEmp({ ...currentEmp, salary: parseFloat(e.target.value) })}
                        required
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                      <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowEmpModal(false)}>Cancel</button>
                      <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>Save Profile</button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </>
        )}

        {activePage === 'flavours' && (
          <>
            <Header title="Ice Cream Flavours" />
            
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
              <button 
                onClick={() => {
                  setCurrentFlavour({ flavourName: '', price: '', availability: true, imageUrl: '' });
                  setShowFlavourModal(true);
                }} 
                className="btn btn-primary"
              >
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
                          <button 
                            onClick={() => {
                              setCurrentFlavour(flav);
                              setShowFlavourModal(true);
                            }} 
                            className="btn btn-secondary" 
                            style={{ padding: '6px 12px', fontSize: '13px' }}
                          >
                            <Edit3 size={14} />
                          </button>
                          <button 
                            onClick={() => handleDeleteFlavour(flav.id)} 
                            className="btn btn-danger" 
                            style={{ padding: '6px 12px', fontSize: '13px' }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredFlavours.length === 0 && (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                        No flavours found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Flavour Add/Edit Modal */}
            {showFlavourModal && (
              <div className="modal-overlay">
                <div className="modal-content">
                  <div className="modal-header">
                    <h3 className="modal-title">{currentFlavour.id ? 'Modify Flavour Details' : 'Add New Flavor Scoop'}</h3>
                    <button className="modal-close" onClick={() => setShowFlavourModal(false)}><X /></button>
                  </div>
                  <form onSubmit={handleSaveFlavour}>
                    <div className="form-group">
                      <label className="form-label" htmlFor="flav-name">Flavour Name</label>
                      <input
                        type="text"
                        id="flav-name"
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
                      <label className="form-label" htmlFor="flav-price">Price Per Scoop (₹)</label>
                      <input
                        type="number"
                        id="flav-price"
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
                        id="flav-avail"
                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                        checked={currentFlavour.availability}
                        onChange={(e) => setCurrentFlavour({ ...currentFlavour, availability: e.target.checked })}
                      />
                      <label className="form-label" htmlFor="flav-avail" style={{ margin: 0, cursor: 'pointer' }}>Available for ordering</label>
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

        {activePage === 'bills' && (
          <>
            <Header title="Billing Records" />
            
            <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
              <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
                <input
                  type="text"
                  className="input-field"
                  style={{ width: '100%', paddingLeft: '40px' }}
                  placeholder="Search bills by table or status..."
                  value={billSearch}
                  onChange={(e) => setBillSearch(e.target.value)}
                />
                <Search size={18} style={{ position: 'absolute', left: '14px', top: '16px', color: 'var(--text-muted)' }} />
              </div>
            </div>

            <div className="table-container">
              <table className="premium-table">
                <thead>
                  <tr>
                    <th>Bill ID</th>
                    <th>Table Number</th>
                    <th>Server Name</th>
                    <th>Total Amount</th>
                    <th>Payment Status</th>
                    <th>Payment Method</th>
                    <th>Date Generated</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBills.map((bill) => (
                    <tr key={bill.id}>
                      <td style={{ fontWeight: 600 }}>#B-{bill.id}</td>
                      <td>Table {bill.order.table.tableNumber}</td>
                      <td>{bill.order.server?.name || 'Admin'}</td>
                      <td>₹{bill.order.totalAmount.toFixed(2)}</td>
                      <td>
                        <span className={`badge ${bill.paymentStatus === 'PAID' ? 'badge-success' : 'badge-pending'}`}>
                          {bill.paymentStatus}
                        </span>
                      </td>
                      <td>
                        {bill.paymentMethod === 'NONE' ? (
                          <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>-</span>
                        ) : (
                          <span className="badge badge-info">{bill.paymentMethod}</span>
                        )}
                      </td>
                      <td>{new Date(bill.billDate).toLocaleString()}</td>
                    </tr>
                  ))}
                  {filteredBills.length === 0 && (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                        No billing history found.
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

export default OwnerDashboard;
