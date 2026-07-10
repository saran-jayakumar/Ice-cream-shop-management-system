import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import Spinner from '../components/Spinner';
import { useToast } from '../hooks/useToast';
import { flavourService } from '../services/flavourService';
import { orderService } from '../services/orderService';
import { ShoppingCart, Plus, Minus, Check, Edit, X, Share2, Trash2 } from 'lucide-react';

const ServerDashboard = () => {
  const [activePage, setActivePage] = useState('tables');
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  // Data states
  const [tables, setTables] = useState([]);
  const [flavours, setFlavours] = useState([]);
  const [orders, setOrders] = useState([]);

  // Active Order Builder state
  const [selectedTable, setSelectedTable] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderItems, setOrderItems] = useState({}); // Mapping: flavourId -> quantity

  // Fetch initial data
  const loadData = async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    try {
      const tableData = await orderService.getAllTables();
      setTables(tableData);

      const flavourData = await flavourService.getAllFlavours();
      setFlavours(flavourData);

      const ordersData = await orderService.getAllOrders();
      setOrders(ordersData);
    } catch (err) {
      if (showSpinner) {
        showToast('Error loading server menu data', 'error');
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

  // Open Order Modal for a Table
  const handleOpenOrder = (table) => {
    setSelectedTable(table);
    setOrderItems({}); // Clear items

    // If table is OCCUPIED, populate with existing pending order
    if (table.status === 'OCCUPIED') {
      const activeOrder = orders.find(o => o.table.id === table.id && o.orderStatus === 'PENDING');
      if (activeOrder) {
        const itemMap = {};
        activeOrder.items.forEach(item => {
          itemMap[item.flavour.id] = item.quantity;
        });
        setOrderItems(itemMap);
      }
    }

    setShowOrderModal(true);
  };

  // Split a table dynamically
  const handleSplitTable = async (e, table) => {
    e.stopPropagation();
    
    // Auto-calculate the next available suffix (A, B, C...)
    const baseNumber = table.tableNumber;
    const existingSplits = tables.filter(t => t.tableNumber.startsWith(`${baseNumber}-`));
    const usedSuffixes = existingSplits.map(t => {
      const parts = t.tableNumber.split('-');
      return parts[1] ? parts[1].toUpperCase() : '';
    });
    
    let nextCharCode = 65; // ASCII code for 'A'
    while (usedSuffixes.includes(String.fromCharCode(nextCharCode))) {
      nextCharCode++;
    }
    const suffix = String.fromCharCode(nextCharCode);
    
    setLoading(true);
    try {
      await orderService.splitTable(table.id, suffix);
      showToast(`Table ${table.tableNumber} split into ${table.tableNumber}-${suffix} successfully!`, 'success');
      await loadData();
    } catch (err) {
      const msg = err.response?.data?.message || 'Error splitting table';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Delete a split table
  const handleDeleteTable = async (e, table) => {
    e.stopPropagation();
    if (!confirm(`Are you sure you want to delete split Table ${table.tableNumber}?`)) return;

    setLoading(true);
    try {
      await orderService.deleteTable(table.id);
      showToast(`Split Table ${table.tableNumber} deleted successfully.`, 'success');
      await loadData();
    } catch (err) {
      const msg = err.response?.data?.message || 'Error deleting split table';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Adjust flavour quantities in builder
  const handleAdjustQuantity = (flavourId, change) => {
    setOrderItems((prev) => {
      const currentQty = prev[flavourId] || 0;
      const nextQty = Math.max(0, currentQty + change);
      
      const newItems = { ...prev };
      if (nextQty === 0) {
        delete newItems[flavourId];
      } else {
        newItems[flavourId] = nextQty;
      }
      return newItems;
    });
  };

  // Submit Order to backend
  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    const itemsArray = Object.keys(orderItems).map(id => ({
      flavourId: parseInt(id),
      quantity: orderItems[id]
    }));

    if (itemsArray.length === 0) {
      showToast('Please add at least one ice cream flavor!', 'error');
      return;
    }

    setLoading(true);
    try {
      await orderService.createOrder({
        tableId: selectedTable.id,
        items: itemsArray
      });
      showToast(`Order for Table ${selectedTable.tableNumber} submitted to Cashier!`, 'success');
      setShowOrderModal(false);
      loadData();
    } catch (err) {
      showToast('Error submitting table order', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Get active order sum in modal
  const getOrderTotal = () => {
    let total = 0.0;
    Object.keys(orderItems).forEach(flavId => {
      const flavour = flavours.find(f => f.id.toString() === flavId);
      if (flavour) {
        total += flavour.price * orderItems[flavId];
      }
    });
    return total;
  };

  return (
    <div className="app-container">
      <Spinner show={loading} />
      <Sidebar activePage={activePage} setActivePage={setActivePage} />
      
      <div className="main-content">
        {activePage === 'tables' && (
          <>
            <Header title="Service Tables Map" />
            <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
              Select a table below to take customer orders, edit pending orders, or view status.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '24px' }}>
              {[...tables].sort((a, b) => {
                const aParts = a.tableNumber.split('-');
                const bParts = b.tableNumber.split('-');
                const aBase = parseInt(aParts[0]) || 0;
                const bBase = parseInt(bParts[0]) || 0;
                if (aBase !== bBase) {
                  return aBase - bBase;
                }
                return (aParts[1] || '').localeCompare(bParts[1] || '');
              }).map((table) => {
                const isOccupied = table.status === 'OCCUPIED';
                const isSplit = table.tableNumber.includes('-');
                return (
                  <div 
                    key={table.id} 
                    className="card"
                    style={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center', 
                      gap: '16px', 
                      textAlign: 'center',
                      cursor: 'pointer',
                      position: 'relative',
                      border: isOccupied ? '2px solid var(--color-primary)' : 'var(--glass-border)'
                    }}
                    onClick={() => handleOpenOrder(table)}
                  >
                    {isSplit && table.status === 'AVAILABLE' && (
                      <button 
                        onClick={(e) => handleDeleteTable(e, table)}
                        title="Delete split table"
                        style={{ 
                          position: 'absolute', 
                          top: '12px', 
                          right: '12px', 
                          background: 'rgba(239, 83, 80, 0.1)', 
                          color: '#ef5350', 
                          border: 'none', 
                          borderRadius: '50%', 
                          padding: '6px', 
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          zIndex: 10
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}

                    <img 
                      src="/ice-cream-table.png" 
                      alt={`Table ${table.tableNumber}`} 
                      style={{ 
                        width: '64px', 
                        height: '64px', 
                        objectFit: 'contain',
                        filter: isOccupied ? 'drop-shadow(0 4px 12px rgba(255, 126, 157, 0.4))' : 'none'
                      }} 
                    />
                    <div>
                      <h3 style={{ fontSize: '18px', fontWeight: 800 }}>Table {table.tableNumber}</h3>
                      <span className={`badge ${isOccupied ? 'badge-danger' : 'badge-success'}`} style={{ marginTop: '8px' }}>
                        {isOccupied ? 'OCCUPIED' : 'AVAILABLE'}
                      </span>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                      <button 
                        className={`btn ${isOccupied ? 'btn-secondary' : 'btn-primary'}`}
                        style={{ flex: 1, justifyContent: 'center', fontSize: '14px', padding: '8px' }}
                      >
                        {isOccupied && <Edit size={14} />}
                        <span>{isOccupied ? 'Edit Order' : 'Take Order'}</span>
                      </button>
                      {!isSplit && (
                        <button 
                          onClick={(e) => handleSplitTable(e, table)}
                          className="btn btn-primary"
                          title="Split Table"
                          style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          <img 
                            src="/split-table.png" 
                            alt="Split Table" 
                            style={{ width: '16px', height: '16px', objectFit: 'contain', filter: 'brightness(0) invert(1)' }} 
                          />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {activePage === 'orders' && (
          <>
            <Header title="My Order Logs" />
            <div className="table-container" style={{ marginTop: '24px' }}>
              <table className="premium-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Table</th>
                    <th>Scoops Count</th>
                    <th>Total (₹)</th>
                    <th>Payment Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((ord) => (
                    <tr key={ord.id}>
                      <td style={{ fontWeight: 600 }}>#ORD-{ord.id}</td>
                      <td>Table {ord.table.tableNumber}</td>
                      <td>{ord.items.reduce((acc, curr) => acc + curr.quantity, 0)} scoops</td>
                      <td style={{ fontWeight: 700 }}>₹{ord.totalAmount.toFixed(2)}</td>
                      <td>
                        <span className={`badge ${ord.orderStatus === 'COMPLETED' ? 'badge-success' : 'badge-pending'}`}>
                          {ord.orderStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {orders.length === 0 && (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                        No orders taken yet. Go to Service Tables to create one!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Order Builder Modal */}
        {showOrderModal && selectedTable && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '640px', padding: '28px' }}>
              <div className="modal-header">
                <div>
                  <h3 className="modal-title">Table {selectedTable.tableNumber} Order</h3>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Status: {selectedTable.status}
                  </span>
                </div>
                <button className="modal-close" onClick={() => setShowOrderModal(false)}><X /></button>
              </div>

              <form onSubmit={handleSubmitOrder} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', gap: '20px', height: '360px' }}>
                  {/* Left Column: Flavour Selection */}
                  <div style={{ flex: 1, overflowY: 'auto', paddingRight: '10px', borderRight: '1px solid var(--border-color)' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '12px' }}>Flavour Menu</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {flavours.map((flav) => {
                        const qty = orderItems[flav.id] || 0;
                        const isAvailable = flav.availability;
                        return (
                          <div 
                            key={flav.id} 
                            style={{ 
                              display: 'flex', 
                              justifyContent: 'space-between', 
                              alignItems: 'center', 
                              padding: '10px 14px', 
                              background: isAvailable ? 'var(--bg-app)' : 'rgba(0, 0, 0, 0.02)', 
                              borderRadius: 'var(--radius-md)',
                              opacity: isAvailable ? 1 : 0.65,
                              border: isAvailable ? '1px solid transparent' : '1px dashed var(--border-color)',
                              transition: 'all var(--transition-fast)'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                               {flav.imageUrl ? (
                                 <img 
                                   src={flav.imageUrl} 
                                   alt={flav.flavourName} 
                                   style={{ width: '44px', height: '44px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--border-color)' }} 
                                 />
                               ) : (
                                 <div style={{ width: '44px', height: '44px', background: 'rgba(245, 163, 183, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', fontSize: '20px' }}>
                                   🍦
                                 </div>
                               )}
                              <div>
                                <div style={{ fontWeight: 600, fontSize: '14px', color: isAvailable ? 'var(--text-main)' : 'var(--text-muted)' }}>
                                  {flav.flavourName}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                                  <span style={{ fontSize: '12px', fontWeight: 600, color: isAvailable ? 'var(--color-primary)' : 'var(--text-muted)' }}>
                                    ₹{flav.price.toFixed(2)}
                                  </span>
                                  {!isAvailable && (
                                    <span className="badge badge-danger" style={{ fontSize: '9px', padding: '1px 5px', textTransform: 'uppercase', borderRadius: '4px', letterSpacing: '0.2px' }}>
                                      Out of stock
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <button 
                                type="button" 
                                className="btn btn-secondary" 
                                style={{ padding: '4px 8px', borderRadius: 'var(--radius-sm)' }}
                                onClick={() => handleAdjustQuantity(flav.id, -1)}
                                disabled={qty === 0 || !isAvailable}
                              >
                                <Minus size={12} />
                              </button>
                              <span style={{ fontWeight: 700, fontSize: '14px', minWidth: '18px', textAlign: 'center', color: isAvailable ? 'var(--text-main)' : 'var(--text-muted)' }}>
                                {qty}
                              </span>
                              <button 
                                type="button" 
                                className="btn btn-secondary" 
                                style={{ padding: '4px 8px', borderRadius: 'var(--radius-sm)' }}
                                onClick={() => handleAdjustQuantity(flav.id, 1)}
                                disabled={!isAvailable}
                              >
                                <Plus size={12} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right Column: Running Order Items Cart */}
                  <div style={{ width: '220px', display: 'flex', flexDirection: 'column' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '12px' }}>Selected Cart</h4>
                    <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {Object.keys(orderItems).map(flavId => {
                        const flav = flavours.find(f => f.id.toString() === flavId);
                        const qty = orderItems[flavId];
                        if (!flav) return null;
                        return (
                          <div key={flavId} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>
                            <span>{flav.flavourName} (x{qty})</span>
                            <span style={{ fontWeight: 600 }}>₹{(flav.price * qty).toFixed(2)}</span>
                          </div>
                        );
                      })}
                      {Object.keys(orderItems).length === 0 && (
                        <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '40px', fontSize: '13px' }}>
                          Cart is empty
                        </div>
                      )}
                    </div>

                    <div style={{ borderTop: '2px solid var(--border-color)', paddingTop: '12px', marginTop: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', fontWeight: 800 }}>
                        <span>Subtotal:</span>
                        <span>₹{getOrderTotal().toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowOrderModal(false)}>Close</button>
                  <button type="submit" className="btn btn-primary" style={{ minWidth: '160px', justifyContent: 'center' }}>
                    <ShoppingCart size={16} />
                    <span>Submit to Cashier</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ServerDashboard;
