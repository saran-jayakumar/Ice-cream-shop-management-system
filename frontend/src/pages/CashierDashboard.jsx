import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import Spinner from '../components/Spinner';
import { useToast } from '../hooks/useToast';
import { billService } from '../services/billService';
import { orderService } from '../services/orderService';
import { Search, Receipt, CreditCard, Clock, Printer, X } from 'lucide-react';

const CashierDashboard = () => {
  const [activePage, setActivePage] = useState('orders');
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  // Data states
  const [pendingOrders, setPendingOrders] = useState([]);
  const [bills, setBills] = useState([]);
  const [currentBill, setCurrentBill] = useState(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  // Search filter
  const [billSearch, setBillSearch] = useState('');

  // Fetch initial data
  const loadData = async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    try {
      const orders = await orderService.getPendingOrders();
      setPendingOrders(orders);

      const generatedBills = await billService.getAllBills();
      setBills(generatedBills);
    } catch (err) {
      if (showSpinner) {
        showToast('Error loading cashier data', 'error');
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

  // Action: Generate Bill for a pending table order
  const handleGenerateBill = async (orderId) => {
    setLoading(true);
    try {
      const bill = await billService.generateBill(orderId);
      showToast('Bill generated successfully', 'success');
      setCurrentBill(bill);
      setShowInvoiceModal(true);
      loadData();
    } catch (err) {
      showToast('Error generating bill', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Action: Complete Payment
  const handleCompletePayment = async (billId, method) => {
    setLoading(true);
    try {
      await billService.updatePaymentStatus(billId, 'PAID', method);
      showToast(`Payment confirmed via ${method}. Table is now free!`, 'success');
      setShowInvoiceModal(false);
      loadData();
    } catch (err) {
      showToast('Error completing payment', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Action: Open existing bill in invoice view
  const handleViewBill = (bill) => {
    setCurrentBill(bill);
    setShowInvoiceModal(true);
  };

  // Print Invoice (Simulate standard printing, trigger window.print for a clean receipt)
  const handlePrintReceipt = () => {
    window.print();
  };

  // Filters
  const filteredBills = bills.filter(bill => 
    bill.order.table.tableNumber.toString().includes(billSearch) ||
    bill.paymentStatus.toLowerCase().includes(billSearch.toLowerCase()) ||
    (bill.order.server?.name || '').toLowerCase().includes(billSearch.toLowerCase())
  );

  return (
    <div className="app-container">
      <Spinner show={loading} />
      <Sidebar activePage={activePage} setActivePage={setActivePage} />
      
      <div className="main-content">
        {activePage === 'orders' && (
          <>
            <Header title="Completed Table Orders" />
            <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
              Select table orders submitted by servers to generate invoice and collect payment.
            </p>

            <div className="dashboard-grid">
              {pendingOrders.map((order) => (
                <div key={order.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Table #{order.table.tableNumber}</h3>
                    <span className="badge badge-pending">PENDING BILL</span>
                  </div>
                  
                  <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                    <div>Server: <strong>{order.server?.name || 'Server'}</strong></div>
                    <div style={{ marginTop: '4px' }}>Items count: {order.items.reduce((acc, curr) => acc + curr.quantity, 0)} scoops</div>
                  </div>

                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Subtotal</span>
                      <div style={{ fontSize: '20px', fontWeight: 800 }}>₹{order.totalAmount.toFixed(2)}</div>
                    </div>
                    <button 
                      onClick={() => handleGenerateBill(order.id)} 
                      className="btn btn-primary"
                      style={{ padding: '8px 16px', fontSize: '14px' }}
                    >
                      <Receipt size={16} />
                      <span>Checkout</span>
                    </button>
                  </div>
                </div>
              ))}

              {pendingOrders.length === 0 && (
                <div className="card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
                  <Clock size={48} style={{ margin: '0 auto 16px auto', display: 'block', opacity: 0.5 }} />
                  <h3>No pending table checkouts</h3>
                  <p style={{ marginTop: '6px' }}>When servers submit orders, they will show up here.</p>
                </div>
              )}
            </div>
          </>
        )}

        {activePage === 'bills' && (
          <>
            <Header title="Billing Logs" />
            
            <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
              <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
                <input
                  type="text"
                  className="input-field"
                  style={{ width: '100%', paddingLeft: '40px' }}
                  placeholder="Search by table, cashier, or status..."
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
                    <th>Invoice ID</th>
                    <th>Table Number</th>
                    <th>Server Name</th>
                    <th>Total (₹)</th>
                    <th>Payment Status</th>
                    <th>Payment Method</th>
                    <th>Date</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBills.map((bill) => (
                    <tr key={bill.id}>
                      <td style={{ fontWeight: 600 }}>#INV-{bill.id}</td>
                      <td>Table {bill.order.table.tableNumber}</td>
                      <td>{bill.order.server?.name || 'Server'}</td>
                      <td style={{ fontWeight: 700 }}>₹{bill.order.totalAmount.toFixed(2)}</td>
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
                      <td style={{ textAlign: 'right' }}>
                        <button 
                          onClick={() => handleViewBill(bill)} 
                          className="btn btn-secondary"
                          style={{ padding: '6px 12px', fontSize: '13px' }}
                        >
                          <Receipt size={14} />
                          <span>View Invoice</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredBills.length === 0 && (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                        No billing history matching the criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Invoice View Modal */}
        {showInvoiceModal && currentBill && (
          <div className="modal-overlay">
            <div className="modal-content print-receipt-card" style={{ maxWidth: '440px', padding: '28px' }}>
              <div className="modal-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '24px' }}>🍦</span>
                  <div style={{ fontWeight: 800, fontSize: '18px' }}>One Scoop Bill</div>
                </div>
                <button className="modal-close" onClick={() => setShowInvoiceModal(false)}><X /></button>
              </div>

              {/* Receipt Body */}
              <div style={{ borderTop: '2px dashed var(--border-color)', borderBottom: '2px dashed var(--border-color)', padding: '20px 0', margin: '16px 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                  <span>Invoice: <strong>#INV-{currentBill.id}</strong></span>
                  <span>Date: {new Date(currentBill.billDate).toLocaleDateString()}</span>
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                  Table: <strong>Table {currentBill.order.table.tableNumber}</strong> | Server: <strong>{currentBill.order.server?.name || 'Staff'}</strong>
                </div>
                {currentBill.paymentStatus === 'PAID' && (
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                    Payment Method: <strong style={{ color: 'var(--color-primary)' }}>{currentBill.paymentMethod}</strong>
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
                  {currentBill.order.items?.map((item) => (
                    <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                      <span>{item.flavour.flavourName} (x{item.quantity})</span>
                      <span>₹{(item.flavour.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: 'var(--text-muted)' }}>
                  <span>Subtotal</span>
                  <span>₹{currentBill.order.totalAmount.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: 'var(--text-muted)' }}>
                  <span>Tax (5% State Tax)</span>
                  <span>₹{(currentBill.order.totalAmount * 0.05).toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 800, marginTop: '8px' }}>
                  <span>Total Amount</span>
                  <span>₹{(currentBill.order.totalAmount * 1.05).toFixed(2)}</span>
                </div>
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {currentBill.paymentStatus === 'PENDING' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <button 
                      onClick={() => handleCompletePayment(currentBill.id, 'CASH')} 
                      className="btn btn-primary"
                      style={{ width: '100%', justifyContent: 'center', background: '#388e3c', borderColor: '#388e3c' }}
                    >
                      💵 Collect Cash Payment
                    </button>
                    <button 
                      onClick={() => handleCompletePayment(currentBill.id, 'ONLINE')} 
                      className="btn btn-primary"
                      style={{ width: '100%', justifyContent: 'center', background: '#1976d2', borderColor: '#1976d2' }}
                    >
                      💳 Collect Online Payment
                    </button>
                  </div>
                ) : (
                  <div className="badge badge-success" style={{ textAlign: 'center', width: '100%', padding: '10px', fontSize: '14px', borderRadius: 'var(--radius-md)' }}>
                    ✨ TRANSACTION COMPLETED
                  </div>
                )}
                
                <button 
                  onClick={handlePrintReceipt} 
                  className="btn btn-secondary"
                  style={{ width: '100%', justifyContent: 'center', marginTop: '4px' }}
                >
                  <Printer size={16} />
                  <span>Print Receipt</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CashierDashboard;
