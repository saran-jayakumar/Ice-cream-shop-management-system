import React from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { useToast } from '../hooks/useToast';
import { 
  LayoutDashboard, 
  Users, 
  IceCream, 
  Receipt, 
  ClipboardList 
} from 'lucide-react';

const Sidebar = ({ activePage, setActivePage }) => {
  const user = authService.getCurrentUser();
  const navigate = useNavigate();
  const { showToast } = useToast();

  if (!user) return null;

  const renderOwnerMenu = () => (
    <>
      <li className={`sidebar-item ${activePage === 'dashboard' ? 'active' : ''}`}>
        <button onClick={() => setActivePage('dashboard')}>
          <LayoutDashboard size={20} />
          <span>Stats Dashboard</span>
        </button>
      </li>
      <li className={`sidebar-item ${activePage === 'employees' ? 'active' : ''}`}>
        <button onClick={() => setActivePage('employees')}>
          <Users size={20} />
          <span>Employees</span>
        </button>
      </li>
      <li className={`sidebar-item ${activePage === 'flavours' ? 'active' : ''}`}>
        <button onClick={() => setActivePage('flavours')}>
          <IceCream size={20} />
          <span>Flavour Shop</span>
        </button>
      </li>
      <li className={`sidebar-item ${activePage === 'bills' ? 'active' : ''}`}>
        <button onClick={() => setActivePage('bills')}>
          <Receipt size={20} />
          <span>Billing Records</span>
        </button>
      </li>
    </>
  );

  const renderManagerMenu = () => (
    <>
      <li className={`sidebar-item ${activePage === 'dashboard' ? 'active' : ''}`}>
        <button onClick={() => setActivePage('dashboard')}>
          <LayoutDashboard size={20} />
          <span>Reports View</span>
        </button>
      </li>
      <li className={`sidebar-item ${activePage === 'employees' ? 'active' : ''}`}>
        <button onClick={() => setActivePage('employees')}>
          <Users size={20} />
          <span>Employee Shift</span>
        </button>
      </li>
      <li className={`sidebar-item ${activePage === 'flavours' ? 'active' : ''}`}>
        <button onClick={() => setActivePage('flavours')}>
          <IceCream size={20} />
          <span>Flavour CRUD</span>
        </button>
      </li>
      <li className={`sidebar-item ${activePage === 'orders' ? 'active' : ''}`}>
        <button onClick={() => setActivePage('orders')}>
          <ClipboardList size={20} />
          <span>Daily Orders</span>
        </button>
      </li>
    </>
  );

  const renderCashierMenu = () => (
    <>
      <li className={`sidebar-item ${activePage === 'orders' ? 'active' : ''}`}>
        <button onClick={() => setActivePage('orders')}>
          <ClipboardList size={20} />
          <span>Table Orders</span>
        </button>
      </li>
      <li className={`sidebar-item ${activePage === 'bills' ? 'active' : ''}`}>
        <button onClick={() => setActivePage('bills')}>
          <Receipt size={20} />
          <span>Invoices & Bills</span>
        </button>
      </li>
    </>
  );

  const renderServerMenu = () => (
    <>
      <li className={`sidebar-item ${activePage === 'tables' ? 'active' : ''}`}>
        <button onClick={() => setActivePage('tables')}>
          <LayoutDashboard size={20} />
          <span>Service Tables</span>
        </button>
      </li>
      <li className={`sidebar-item ${activePage === 'orders' ? 'active' : ''}`}>
        <button onClick={() => setActivePage('orders')}>
          <ClipboardList size={20} />
          <span>Order History</span>
        </button>
      </li>
    </>
  );

  return (
    <div className="sidebar" id="app-sidebar">
      <div className="logo-container" style={{ justifyContent: 'center', marginBottom: '36px' }}>
        <img 
          src="/logo.png" 
          alt="One Scoop Logo" 
          style={{ width: '140px', height: 'auto', objectFit: 'contain' }} 
        />
      </div>

      <ul className="sidebar-menu">
        {user.role === 'OWNER' && renderOwnerMenu()}
        {user.role === 'ASSISTANT_MANAGER' && renderManagerMenu()}
        {user.role === 'CASHIER' && renderCashierMenu()}
        {user.role === 'SERVER' && renderServerMenu()}
      </ul>
    </div>
  );
};

export default Sidebar;
