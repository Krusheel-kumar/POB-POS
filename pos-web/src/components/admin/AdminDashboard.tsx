import React, { useState, useMemo } from 'react';
import type { Order, Bill } from '../../types/pos';
import { ReceiptModal } from '../ReceiptModal';
import { posApiClient } from '../../api/posApiClient';

export type DashboardTimeline = 'TODAY' | 'YESTERDAY' | 'LAST_7_DAYS' | 'THIS_MONTH' | 'ALL' | 'CUSTOM';
export type OrderStatusFilter = 'ALL' | 'SETTLED' | 'IN_FLIGHT' | 'CANCELLED';

export interface AdminDashboardProps {
  orders: Order[];
  bills: Bill[];
  voidLogs?: any[];
  outletId?: string;
  isLoading: boolean;
  onRefresh: () => void;
}

const toLocalDateString = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  orders,
  bills,
  voidLogs = [],
  outletId,
  isLoading,
  onRefresh,
}) => {
  const [timeline, setTimeline] = useState<DashboardTimeline>('TODAY');
  const [orderStatusFilter, setOrderStatusFilter] = useState<OrderStatusFilter>('ALL');
  const [customFromDate, setCustomFromDate] = useState<string>(() => toLocalDateString(new Date()));
  const [customToDate, setCustomToDate] = useState<string>(() => toLocalDateString(new Date()));
  const [showVoidAudit, setShowVoidAudit] = useState<boolean>(true);

  // Modal inspection state for viewing slips/reprints
  const [inspectedOrder, setInspectedOrder] = useState<Order | null>(null);
  const [inspectedBill, setInspectedBill] = useState<Bill | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState<boolean>(false);

  // Cancellation prompt state
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);
  const [cancellationReason, setCancellationReason] = useState<string>('');

  // Date filtering predicate
  const isWithinTimeline = (rawDate: any): boolean => {
    if (!rawDate) return false;
    if (timeline === 'ALL') return true;

    const d = new Date(rawDate);
    if (isNaN(d.getTime())) return false;

    const itemDayStr = toLocalDateString(d);
    const now = new Date();
    const todayStr = toLocalDateString(now);

    if (timeline === 'TODAY') {
      return itemDayStr === todayStr || (d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate());
    }

    if (timeline === 'YESTERDAY') {
      const yesterdayDate = new Date(now);
      yesterdayDate.setDate(now.getDate() - 1);
      const yesterdayStr = toLocalDateString(yesterdayDate);
      return itemDayStr === yesterdayStr;
    }

    if (timeline === 'LAST_7_DAYS') {
      const cutoff = new Date(now);
      cutoff.setDate(now.getDate() - 6);
      cutoff.setHours(0, 0, 0, 0);
      return d.getTime() >= cutoff.getTime();
    }

    if (timeline === 'THIS_MONTH') {
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    }

    if (timeline === 'CUSTOM') {
      if (customFromDate && itemDayStr < customFromDate) return false;
      if (customToDate && itemDayStr > customToDate) return false;
      return true;
    }

    return true;
  };

  // Human-readable timeline title
  const timelineTitle = useMemo(() => {
    const now = new Date();
    if (timeline === 'TODAY') {
      return `Today (${now.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })})`;
    }
    if (timeline === 'YESTERDAY') {
      const y = new Date(now);
      y.setDate(now.getDate() - 1);
      return `Yesterday (${y.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })})`;
    }
    if (timeline === 'LAST_7_DAYS') {
      const past = new Date(now);
      past.setDate(now.getDate() - 6);
      return `Last 7 Days (${past.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} - ${now.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })})`;
    }
    if (timeline === 'THIS_MONTH') {
      return `This Month (${now.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })})`;
    }
    if (timeline === 'CUSTOM') {
      return `Custom: ${customFromDate} to ${customToDate}`;
    }
    return 'All Time History';
  }, [timeline, customFromDate, customToDate]);

  // Filter bills strictly for the selected timeline
  const filteredBills = useMemo(() => {
    return bills.filter((b) => isWithinTimeline(b.settledAt || b.createdAt || (b.payments && b.payments[0]?.createdAt)));
  }, [bills, timeline, customFromDate, customToDate]);

  // Filter orders strictly for the selected timeline
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => isWithinTimeline(o.createdAt));
  }, [orders, timeline, customFromDate, customToDate]);

  // Filter void audit logs strictly for the selected timeline
  const filteredVoidLogs = useMemo(() => {
    return voidLogs.filter((v) => isWithinTimeline(v.createdAt || v.time));
  }, [voidLogs, timeline, customFromDate, customToDate]);

  // Revenue & Billing Metrics strictly derived from database records
  const settledBills = useMemo(() => {
    return filteredBills.filter((b) => b.status === 'PAID' || (b.paidAmount && b.paidAmount > 0));
  }, [filteredBills]);

  const totalRevenue = useMemo(() => {
    return settledBills.reduce((sum, b) => sum + (b.paidAmount || (b.status === 'PAID' ? b.totalAmount : 0)), 0);
  }, [settledBills]);

  const totalInvoiced = useMemo(() => {
    return filteredBills.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
  }, [filteredBills]);

  const pendingBills = useMemo(() => {
    return filteredBills.filter((b) => b.status === 'ISSUED' || b.status === 'PARTIALLY_PAID');
  }, [filteredBills]);

  const pendingAmount = useMemo(() => {
    return pendingBills.reduce((sum, b) => sum + (b.totalAmount - (b.paidAmount || 0)), 0);
  }, [pendingBills]);

  // Payment method breakdowns (UPI, Cash, Card)
  const { upiTotal, cashTotal, cardTotal } = useMemo(() => {
    let upi = 0;
    let cash = 0;
    let card = 0;

    settledBills.forEach((b) => {
      if (b.payments && b.payments.length > 0) {
        b.payments.forEach((p) => {
          const mode = (p.paymentMethod || '').toUpperCase();
          if (mode === 'UPI') upi += p.amount;
          else if (mode === 'CASH') cash += p.amount;
          else if (mode === 'CARD') card += p.amount;
          else cash += p.amount;
        });
      } else {
        // Fallback to paidAmount based on bill notes or default cash
        cash += b.paidAmount || b.totalAmount;
      }
    });

    return { upiTotal: upi, cashTotal: cash, cardTotal: card };
  }, [settledBills]);

  // Order Counts
  const totalOrdersCount = filteredOrders.length;
  const inFlightOrders = useMemo(() => {
    return filteredOrders.filter((o) => o.status === 'CONFIRMED' || o.status === 'PREPARING' || o.status === 'READY');
  }, [filteredOrders]);

  const settledOrders = useMemo(() => {
    return filteredOrders.filter(
      (o) => o.status === 'BILLED' || o.status === 'COMPLETED' || bills.some((b) => b.orderId === o.id && b.status === 'PAID')
    );
  }, [filteredOrders, bills]);

  const cancelledOrders = useMemo(() => {
    return filteredOrders.filter((o) => o.status === 'CANCELLED');
  }, [filteredOrders]);

  const cancelledOrdersAmount = useMemo(() => {
    return cancelledOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  }, [cancelledOrders]);

  const voidItemsCount = useMemo(() => {
    return filteredVoidLogs.reduce((sum, v) => sum + (v.qty || 1), 0);
  }, [filteredVoidLogs]);

  const voidTotalAmount = useMemo(() => {
    return filteredVoidLogs.reduce((sum, v) => sum + (v.amount || 0), 0);
  }, [filteredVoidLogs]);

  const totalLossOrVoidAmount = cancelledOrdersAmount + voidTotalAmount;
  const averageTicketValue = settledBills.length > 0 ? totalRevenue / settledBills.length : 0;

  // Filtered orders list for the table based on status tab
  const displayedOrders = useMemo(() => {
    if (orderStatusFilter === 'SETTLED') return settledOrders;
    if (orderStatusFilter === 'IN_FLIGHT') return inFlightOrders;
    if (orderStatusFilter === 'CANCELLED') return cancelledOrders;
    return filteredOrders;
  }, [orderStatusFilter, filteredOrders, settledOrders, inFlightOrders, cancelledOrders]);

  // Handle order slip preview / reprint
  const handleViewReceipt = (order: Order) => {
    const associatedBill = bills.find((b) => b.orderId === order.id) || null;
    setInspectedOrder(order);
    setInspectedBill(associatedBill);
    setIsReceiptModalOpen(true);
  };

  // Handle order cancellation
  const handleConfirmCancelOrder = async (orderId: string) => {
    if (!orderId) return;
    try {
      await posApiClient.updateOrderStatus(orderId, 'CANCELLED', cancellationReason || 'Manager Cancelled from Admin Dashboard');
      setCancellingOrderId(null);
      setCancellationReason('');
      onRefresh();
    } catch (err: unknown) {
      alert(`Failed to cancel order: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  if (isLoading) {
    return <div className="loading-spinner">Loading real-time sales & outlet metrics...</div>;
  }

  return (
    <div>
      {/* Top Header & Refresh */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a', fontWeight: 700 }}>
            Restaurant Sales & Performance Dashboard
          </h2>
          <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.875rem' }}>
            Strict database ledger metrics for orders, settled billing, and anti-theft cancellation audit logs.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onRefresh}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <span>↻</span> Refresh Metrics
        </button>
      </div>

      {/* Date Timeline Control Bar */}
      <div className="dashboard-timeline-bar">
        <div className="dashboard-timeline-pills">
          <button
            type="button"
            className={`dashboard-timeline-pill ${timeline === 'TODAY' ? 'active' : ''}`}
            onClick={() => setTimeline('TODAY')}
          >
            Today
          </button>
          <button
            type="button"
            className={`dashboard-timeline-pill ${timeline === 'YESTERDAY' ? 'active' : ''}`}
            onClick={() => setTimeline('YESTERDAY')}
          >
            Yesterday
          </button>
          <button
            type="button"
            className={`dashboard-timeline-pill ${timeline === 'LAST_7_DAYS' ? 'active' : ''}`}
            onClick={() => setTimeline('LAST_7_DAYS')}
          >
            Last 7 Days
          </button>
          <button
            type="button"
            className={`dashboard-timeline-pill ${timeline === 'THIS_MONTH' ? 'active' : ''}`}
            onClick={() => setTimeline('THIS_MONTH')}
          >
            This Month
          </button>
          <button
            type="button"
            className={`dashboard-timeline-pill ${timeline === 'ALL' ? 'active' : ''}`}
            onClick={() => setTimeline('ALL')}
          >
            All Time
          </button>
          <button
            type="button"
            className={`dashboard-timeline-pill ${timeline === 'CUSTOM' ? 'active' : ''}`}
            onClick={() => setTimeline('CUSTOM')}
          >
            Custom Date
          </button>

          {timeline === 'CUSTOM' && (
            <div className="dashboard-custom-date-inputs">
              <input
                type="date"
                className="dashboard-date-input"
                value={customFromDate}
                onChange={(e) => setCustomFromDate(e.target.value)}
                title="From Date"
              />
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>to</span>
              <input
                type="date"
                className="dashboard-date-input"
                value={customToDate}
                onChange={(e) => setCustomToDate(e.target.value)}
                title="To Date"
              />
            </div>
          )}
        </div>

        <div className="dashboard-status-banner">
          <span>📅</span>
          <span>Showing metrics for: <strong>{timelineTitle}</strong></span>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="admin-metrics-grid">
        {/* 1. Collected Revenue */}
        <div className="admin-metric-card revenue-card">
          <div className="admin-metric-title">Collected Revenue</div>
          <div className="admin-metric-value" style={{ color: '#059669' }}>
            ₹{totalRevenue.toFixed(2)}
          </div>
          <div className="admin-metric-sub">
            From {settledBills.length} settled bills ({timeline === 'TODAY' ? 'Today' : timeline === 'YESTERDAY' ? 'Yesterday' : 'Period'})
          </div>
          <div className="metric-splits-row">
            <span className="metric-split-pill upi">UPI: ₹{upiTotal.toFixed(0)}</span>
            <span className="metric-split-pill cash">Cash: ₹{cashTotal.toFixed(0)}</span>
            <span className="metric-split-pill card">Card: ₹{cardTotal.toFixed(0)}</span>
          </div>
        </div>

        {/* 2. Total Invoiced */}
        <div className="admin-metric-card invoiced-card">
          <div className="admin-metric-title">Total Invoiced</div>
          <div className="admin-metric-value">₹{totalInvoiced.toFixed(2)}</div>
          <div className="admin-metric-sub">
            {pendingBills.length > 0 ? (
              <span style={{ color: '#d97706', fontWeight: 600 }}>
                {pendingBills.length} pending settlement (₹{pendingAmount.toFixed(2)})
              </span>
            ) : (
              <span style={{ color: '#16a34a' }}>All invoices settled 100%</span>
            )}
          </div>
        </div>

        {/* 3. Total Orders */}
        <div className="admin-metric-card orders-card">
          <div className="admin-metric-title">Total Orders Placed</div>
          <div className="admin-metric-value">{totalOrdersCount}</div>
          <div className="admin-metric-sub">
            {settledOrders.length} settled • Avg Ticket: ₹{averageTicketValue.toFixed(0)}
          </div>
        </div>

        {/* 4. Cancelled / Voids (CRITICAL) */}
        <div className="admin-metric-card cancelled-card">
          <div className="admin-metric-title" style={{ color: '#dc2626' }}>
            Cancelled & Voided
          </div>
          <div className="admin-metric-value" style={{ color: '#b91c1c' }}>
            {cancelledOrders.length} Orders / {filteredVoidLogs.length} Voids
          </div>
          <div className="admin-metric-sub" style={{ color: '#ef4444' }}>
            ₹{totalLossOrVoidAmount.toFixed(2)} total loss/void recorded
          </div>
          <div style={{ marginTop: '0.4rem' }}>
            <span
              style={{
                fontSize: '0.72rem',
                padding: '2px 6px',
                borderRadius: '4px',
                background: '#fee2e2',
                color: '#991b1b',
                fontWeight: 600,
              }}
            >
              Anti-Theft Manager Protected
            </span>
          </div>
        </div>

        {/* 5. In-Flight Orders */}
        <div className="admin-metric-card inflight-card">
          <div className="admin-metric-title">In-Flight Active</div>
          <div className="admin-metric-value" style={{ color: '#d97706' }}>
            {inFlightOrders.length}
          </div>
          <div className="admin-metric-sub">Active at tables / kitchen queue</div>
        </div>
      </div>

      {/* Recent Order Activity Table */}
      <div className="admin-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '8px' }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#0f172a' }}>
            Recent Order Activity ({timelineTitle})
          </h3>

          {/* Status Tabs */}
          <div className="order-filter-tabs">
            <button
              type="button"
              className={`order-filter-tab ${orderStatusFilter === 'ALL' ? 'active' : ''}`}
              onClick={() => setOrderStatusFilter('ALL')}
            >
              All ({filteredOrders.length})
            </button>
            <button
              type="button"
              className={`order-filter-tab ${orderStatusFilter === 'SETTLED' ? 'active' : ''}`}
              onClick={() => setOrderStatusFilter('SETTLED')}
            >
              Settled ({settledOrders.length})
            </button>
            <button
              type="button"
              className={`order-filter-tab ${orderStatusFilter === 'IN_FLIGHT' ? 'active' : ''}`}
              onClick={() => setOrderStatusFilter('IN_FLIGHT')}
            >
              In-Flight ({inFlightOrders.length})
            </button>
            <button
              type="button"
              className={`order-filter-tab ${orderStatusFilter === 'CANCELLED' ? 'active' : ''}`}
              onClick={() => setOrderStatusFilter('CANCELLED')}
            >
              Cancelled ({cancelledOrders.length})
            </button>
          </div>
        </div>

        {displayedOrders.length === 0 ? (
          <div className="empty-state">
            No orders found matching the filter for {timelineTitle}.
          </div>
        ) : (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Type & Table</th>
                  <th>Status</th>
                  <th>Items Ordered</th>
                  <th>Total Amount</th>
                  <th>Time</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayedOrders.map((order) => {
                  const isSettled = order.status === 'BILLED' || order.status === 'COMPLETED' || bills.some((b) => b.orderId === order.id && b.status === 'PAID');
                  const isCancelled = order.status === 'CANCELLED';

                  return (
                    <tr key={order.id}>
                      <td style={{ fontWeight: 600 }}>{order.orderNumber}</td>
                      <td>
                        {order.orderType === 'DINE_IN' ? (
                          <span style={{ fontWeight: 500 }}>
                            Dine-In {order.tableNumber ? `(Table #${order.tableNumber})` : ''}
                          </span>
                        ) : (
                          <span>{order.orderType}</span>
                        )}
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            isSettled
                              ? 'badge-success'
                              : isCancelled
                              ? 'badge-danger'
                              : 'badge-info'
                          }`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td>
                        {order.items && order.items.length > 0 ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            {order.items.slice(0, 2).map((item, idx) => (
                              <span key={idx} style={{ fontSize: '0.8rem', color: '#334155' }}>
                                {item.quantity}x {item.productNameSnapshot}
                              </span>
                            ))}
                            {order.items.length > 2 && (
                              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                                +{order.items.length - 2} more item(s)
                              </span>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>1 item(s)</span>
                        )}
                      </td>
                      <td style={{ fontWeight: 600 }}>₹{order.totalAmount.toFixed(2)}</td>
                      <td style={{ fontSize: '0.8rem', color: '#64748b' }}>
                        {new Date(order.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                          <button
                            type="button"
                            className="btn-slip-view"
                            onClick={() => handleViewReceipt(order)}
                            title="View / Reprint Customer Tax Invoice slip"
                          >
                            👁 View Slip
                          </button>

                          {!isSettled && !isCancelled && (
                            <button
                              type="button"
                              className="btn btn-outline-danger btn-sm"
                              style={{ padding: '3px 6px', fontSize: '0.72rem' }}
                              onClick={() => setCancellingOrderId(order.id)}
                              title="Cancel this in-flight order"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Cancelled & Void Audit Log Section */}
      <div className="void-audit-section">
        <div className="void-audit-header">
          <div>
            <h4 style={{ margin: 0, fontSize: '1rem', color: '#9a3412', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>⚠️</span> Cancelled Orders & Item Void Audit Trail ({filteredVoidLogs.length + cancelledOrders.length} records)
            </h4>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#78350f' }}>
              Full audit trail recording all staff cancellations, kitchen item voids, manager overrides, and loss amounts.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setShowVoidAudit(!showVoidAudit)}
          >
            {showVoidAudit ? 'Hide Audit Trail' : 'Show Audit Trail'}
          </button>
        </div>

        {showVoidAudit && (
          <div>
            {filteredVoidLogs.length === 0 && cancelledOrders.length === 0 ? (
              <div style={{ padding: '1rem', textAlign: 'center', color: '#15803d', background: '#f0fdf4', borderRadius: '8px', fontSize: '0.85rem' }}>
                ✓ No cancellations or voids recorded for {timelineTitle}. All orders and items intact!
              </div>
            ) : (
              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Type</th>
                      <th>Order / Table</th>
                      <th>Item / Target</th>
                      <th>Qty</th>
                      <th>Loss Amount</th>
                      <th>Reason</th>
                      <th>Authorized By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Render cancelled orders */}
                    {cancelledOrders.map((co) => (
                      <tr key={`canc-${co.id}`}>
                        <td style={{ fontSize: '0.8rem' }}>
                          {new Date(co.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                        </td>
                        <td>
                          <span className="badge badge-danger">Order Cancelled</span>
                        </td>
                        <td style={{ fontWeight: 600 }}>{co.orderNumber} {co.tableNumber ? `(#T${co.tableNumber})` : ''}</td>
                        <td>Entire Order ({co.items?.length || 1} items)</td>
                        <td>1</td>
                        <td style={{ fontWeight: 600, color: '#dc2626' }}>₹{co.totalAmount.toFixed(2)}</td>
                        <td style={{ fontStyle: 'italic', color: '#475569' }}>Staff / Manager Cancelled</td>
                        <td>
                          <span style={{ fontSize: '0.75rem', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>
                            Manager PIN
                          </span>
                        </td>
                      </tr>
                    ))}

                    {/* Render void logs */}
                    {filteredVoidLogs.map((vl) => (
                      <tr key={vl.id}>
                        <td style={{ fontSize: '0.8rem' }}>{vl.time || 'Today'}</td>
                        <td>
                          <span className="badge badge-warning">Item Voided</span>
                        </td>
                        <td style={{ fontWeight: 600 }}>{vl.orderNumber || '-'} {vl.tableNumber ? `(${vl.tableNumber})` : ''}</td>
                        <td>{vl.item}</td>
                        <td>{vl.qty}</td>
                        <td style={{ fontWeight: 600, color: '#dc2626' }}>₹{Number(vl.amount || 0).toFixed(2)}</td>
                        <td style={{ fontStyle: 'italic', color: '#475569' }}>{vl.reason}</td>
                        <td>
                          <span style={{ fontSize: '0.75rem', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>
                            {vl.managerPin || '****1234'} ({vl.originalWaiter || 'Staff'})
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Cancellation Prompt Modal */}
      {cancellingOrderId && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '420px', padding: '1.5rem', background: '#ffffff', borderRadius: '12px' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#dc2626' }}>Cancel Active Order</h3>
            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 1rem 0' }}>
              Are you sure you want to cancel this order? This will free the assigned table, cancel active kitchen tickets, and log this cancellation in the database audit records.
            </p>
            <div className="form-group">
              <label className="form-label">Cancellation Reason:</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Customer changed mind, walkout, billing error"
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                autoFocus
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '1.25rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setCancellingOrderId(null);
                  setCancellationReason('');
                }}
              >
                Go Back
              </button>
              <button
                type="button"
                className="btn btn-danger"
                style={{ background: '#dc2626', color: '#ffffff' }}
                onClick={() => handleConfirmCancelOrder(cancellingOrderId)}
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Thermal Slip Receipt & Reprint Modal */}
      {inspectedOrder && (
        <ReceiptModal
          isOpen={isReceiptModalOpen}
          onClose={() => {
            setIsReceiptModalOpen(false);
            setInspectedOrder(null);
            setInspectedBill(null);
          }}
          order={inspectedOrder}
          bill={inspectedBill || undefined}
        />
      )}
    </div>
  );
};
