import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  ShoppingBag,
  Receipt,
  Clock,
  ShieldAlert,
  FileSpreadsheet,
  Download,
  Search,
  ArrowUpDown,
  CheckCircle2,
  Flame,
  Award,
  AlertTriangle,
  Layers,
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  MOCK_DAILY_SUMMARY,
  MOCK_HOURLY_SALES,
  MOCK_ITEM_MATRIX,
  MOCK_VOID_AUDIT_LOG,
  formatINR,
  type ItemMatrixRecord,
} from '../../lib/mockReportsData';
import './ReportsDashboard.css';

type ReportTab = 'z-report' | 'hourly' | 'item-matrix' | 'void-log' | 'gst-export';

type SortField = 'name' | 'category' | 'qtySold' | 'totalRevenue' | 'foodCostPct';
type SortDirection = 'asc' | 'desc';

export const ReportsDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ReportTab>('z-report');

  // Item Matrix State
  const [itemSearch, setItemSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [sortField, setSortField] = useState<SortField>('totalRevenue');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Hourly Graph mode
  const [hourlyViewMode, setHourlyViewMode] = useState<'revenue' | 'orders'>('revenue');

  // Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Distinct categories for Item Matrix
  const itemCategories = useMemo(() => {
    const set = new Set<string>();
    MOCK_ITEM_MATRIX.forEach((item) => set.add(item.category));
    return ['ALL', ...Array.from(set)];
  }, []);

  // Filtered and sorted Item Matrix
  const filteredAndSortedItems = useMemo(() => {
    let result = [...MOCK_ITEM_MATRIX];

    if (selectedCategory !== 'ALL') {
      result = result.filter((item) => item.category === selectedCategory);
    }

    if (itemSearch.trim() !== '') {
      const q = itemSearch.toLowerCase();
      result = result.filter(
        (item) => item.name.toLowerCase().includes(q) || item.category.toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (typeof valA === 'string') {
        const comp = (valA as string).localeCompare(valB as string);
        return sortDirection === 'asc' ? comp : -comp;
      }

      return sortDirection === 'asc' ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
    });

    return result;
  }, [selectedCategory, itemSearch, sortField, sortDirection]);

  // Determine top 3 and bottom 3 items globally by revenue for visual badges
  const { top3Ids, bottom3Ids } = useMemo(() => {
    const sortedByRev = [...MOCK_ITEM_MATRIX].sort((a, b) => b.totalRevenue - a.totalRevenue);
    const top = new Set(sortedByRev.slice(0, 3).map((i) => i.id));
    const bottom = new Set(sortedByRev.slice(-3).map((i) => i.id));
    return { top3Ids: top, bottom3Ids: bottom };
  }, []);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // CSV Exporter Helper
  const downloadCSV = (filename: string, csvContent: string, toastTitle: string) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(toastTitle);
  };

  const handleExportTable7 = () => {
    const csv = `GSTIN,State,Supply Type,Rate %,Gross Taxable Value,Central Tax (CGST),State Tax (SGST),Total Cess,Net Invoice Value
36AAACK1234F1Z5,Telangana (36),Intra-State B2C,5.00%,152800.00,3820.00,3820.00,0.00,160440.00
`;
    downloadCSV('GSTR1_Table_7_B2C_Consolidated.csv', csv, 'GSTR-1 Table 7 (B2C Consolidated) CSV Downloaded');
  };

  const handleExportSection9_5 = () => {
    const csv = `ECO Operator,ECO GSTIN,Gross Orders,Taxable Value,IGST,CGST,SGST,Net Payable By ECO
Swiggy (Bundl Technologies),29AABCB1234D1ZP,142,33700.00,0.00,842.50,842.50,35385.00
Zomato Limited,07AAACZ1234E1ZR,98,25300.00,0.00,632.50,632.50,26565.00
TOTAL ECO AGGREGATOR,,240,59000.00,0.00,1475.00,1475.00,61950.00
`;
    downloadCSV('GSTR1_Section_9_5_ECO_Aggregators.csv', csv, 'GSTR-1 Section 9(5) (Swiggy/Zomato) CSV Downloaded');
  };

  const handleExportTable12 = () => {
    const csv = `HSN/SAC Code,Description,UQC,Total Quantity,Total Taxable Value,Tax Rate,CGST Amount,SGST Amount,IGST Amount,Total Tax
996331,Restaurant Dining & Takeaway Services,NA,342,152800.00,5.00%,3820.00,3820.00,0.00,7640.00
`;
    downloadCSV('GSTR1_Table_12_HSN_SAC_Summary.csv', csv, 'GSTR-1 Table 12 (HSN/SAC Summary) CSV Downloaded');
  };

  return (
    <div className="reports-container">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="reports-toast" role="status">
          <CheckCircle2 size={20} className="toast-icon-success" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header & Tabs */}
      <div className="reports-header">
        <div className="reports-header-top">
          <div className="reports-header-title-box">
            <h2>
              <Sparkles size={24} color="#4f46e5" />
              Reports & Business Intelligence
            </h2>
            <p>Audited End-of-Day statistics, hourly rushes, menu profitability & statutory GST logs</p>
          </div>
          <div className="reports-date-badge">
            <Clock size={16} />
            <span>Today: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} (Live Audit)</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="reports-tabs-nav" role="tablist">
          <button
            type="button"
            className={`reports-tab-btn ${activeTab === 'z-report' ? 'active' : ''}`}
            onClick={() => setActiveTab('z-report')}
          >
            <Receipt size={16} />
            The Z-Report (End of Day)
          </button>
          <button
            type="button"
            className={`reports-tab-btn ${activeTab === 'hourly' ? 'active' : ''}`}
            onClick={() => setActiveTab('hourly')}
          >
            <Clock size={16} />
            Hourly Sales & Rush Heatmap
          </button>
          <button
            type="button"
            className={`reports-tab-btn ${activeTab === 'item-matrix' ? 'active' : ''}`}
            onClick={() => setActiveTab('item-matrix')}
          >
            <ShoppingBag size={16} />
            Menu Item Sales Matrix
          </button>
          <button
            type="button"
            className={`reports-tab-btn tab-danger ${activeTab === 'void-log' ? 'active' : ''}`}
            onClick={() => setActiveTab('void-log')}
          >
            <ShieldAlert size={16} />
            Anti-Fraud Void Audit Log
          </button>
          <button
            type="button"
            className={`reports-tab-btn ${activeTab === 'gst-export' ? 'active' : ''}`}
            onClick={() => setActiveTab('gst-export')}
          >
            <FileSpreadsheet size={16} />
            GST & CA Export Module
          </button>
        </div>
      </div>

      {/* =========================================================================
          VIEW A: THE Z-REPORT (END OF DAY OVERVIEW)
          ========================================================================= */}
      {activeTab === 'z-report' && (
        <>
          {/* Top KPI Cards */}
          <div className="kpi-grid">
            <div className="kpi-card">
              <div className="kpi-card-indicator" style={{ background: '#4f46e5' }} />
              <div className="kpi-card-header">
                <span className="kpi-card-title">Gross Revenue</span>
                <div className="kpi-card-icon" style={{ background: '#eef2ff', color: '#4f46e5' }}>
                  <TrendingUp size={18} />
                </div>
              </div>
              <div className="kpi-card-value">{formatINR(MOCK_DAILY_SUMMARY.grossSales)}</div>
              <div className="kpi-card-subtitle">
                <span className="positive">↑ +14.2%</span> vs yesterday (₹1,47,500)
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-card-indicator" style={{ background: '#0ea5e9' }} />
              <div className="kpi-card-header">
                <span className="kpi-card-title">Total Orders</span>
                <div className="kpi-card-icon" style={{ background: '#e0f2fe', color: '#0ea5e9' }}>
                  <ShoppingBag size={18} />
                </div>
              </div>
              <div className="kpi-card-value">{MOCK_DAILY_SUMMARY.totalOrders}</div>
              <div className="kpi-card-subtitle">
                <span>Dine-in: 198 | Takeaway: 144</span>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-card-indicator" style={{ background: '#10b981' }} />
              <div className="kpi-card-header">
                <span className="kpi-card-title">Average Order Value</span>
                <div className="kpi-card-icon" style={{ background: '#ecfdf5', color: '#10b981' }}>
                  <Layers size={18} />
                </div>
              </div>
              <div className="kpi-card-value">{formatINR(MOCK_DAILY_SUMMARY.averageOrderValue, true)}</div>
              <div className="kpi-card-subtitle">
                <span className="positive">↑ ₹38.20</span> higher basket size
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-card-indicator" style={{ background: '#f59e0b' }} />
              <div className="kpi-card-header">
                <span className="kpi-card-title">Tax Collected (GST 5%)</span>
                <div className="kpi-card-icon" style={{ background: '#fef3c7', color: '#f59e0b' }}>
                  <Receipt size={18} />
                </div>
              </div>
              <div className="kpi-card-value">{formatINR(MOCK_DAILY_SUMMARY.totalTax)}</div>
              <div className="kpi-card-subtitle">
                <span>CGST: ₹3,820 | SGST: ₹3,820</span>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-card-indicator" style={{ background: '#ef4444' }} />
              <div className="kpi-card-header">
                <span className="kpi-card-title">Total Discounts</span>
                <div className="kpi-card-icon" style={{ background: '#fee2e2', color: '#ef4444' }}>
                  <TrendingDown size={18} />
                </div>
              </div>
              <div className="kpi-card-value">{formatINR(MOCK_DAILY_SUMMARY.discounts)}</div>
              <div className="kpi-card-subtitle">
                <span>Promos & Coupons Applied</span>
              </div>
            </div>
          </div>

          {/* Payment Split & Cash Drawer Reconciliation */}
          <div className="report-card">
            <div className="report-card-header">
              <div>
                <h3 className="report-card-title">Payment Settlement Breakdown</h3>
                <p className="report-card-subtitle">Channel distribution across Digital UPI, Aggregators, Cards & Cash Drawer</p>
              </div>
              <span className="badge-category">Reconciled 100%</span>
            </div>

            <div className="payment-split-grid">
              {/* Donut Chart with Recharts */}
              <div style={{ height: 260, width: '100%', position: 'relative' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={MOCK_DAILY_SUMMARY.detailedSplits}
                      dataKey="amount"
                      nameKey="label"
                      cx="50%"
                      cy="50%"
                      innerRadius={68}
                      outerRadius={105}
                      paddingAngle={3}
                    >
                      {MOCK_DAILY_SUMMARY.detailedSplits.map((entry) => (
                        <Cell key={entry.mode} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: unknown) => [formatINR(Number(val) || 0), 'Settled Amount']}
                      contentStyle={{ background: '#0f172a', color: '#fff', borderRadius: '8px', border: 'none', fontSize: '13px' }}
                      itemStyle={{ color: '#fff' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    textAlign: 'center',
                    pointerEvents: 'none',
                  }}
                >
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>TOTAL COLLECTED</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
                    {formatINR(MOCK_DAILY_SUMMARY.grossSales)}
                  </div>
                </div>
              </div>

              {/* Progress Bars & Amounts List */}
              <div className="payment-bars-list">
                {MOCK_DAILY_SUMMARY.detailedSplits.map((item) => (
                  <div key={item.mode} className="payment-bar-item">
                    <div className="payment-bar-meta">
                      <span className="payment-bar-name">
                        <span className="payment-bar-dot" style={{ backgroundColor: item.color }} />
                        {item.label}
                      </span>
                      <div>
                        <span className="payment-bar-amt">{formatINR(item.amount)}</span>
                        <span className="payment-bar-pct">({item.percentage}%)</span>
                      </div>
                    </div>
                    <div className="payment-track">
                      <div
                        className="payment-fill"
                        style={{ width: `${item.percentage}%`, backgroundColor: item.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* =========================================================================
          VIEW B: HOURLY SALES HEATMAP / TRENDLINE
          ========================================================================= */}
      {activeTab === 'hourly' && (
        <div className="report-card">
          <div className="report-card-header">
            <div>
              <h3 className="report-card-title">
                <Clock size={20} color="#4f46e5" />
                Hourly Sales Heatmap & Peak Rush Analytics
              </h3>
              <p className="report-card-subtitle">
                Identifies peak preparation windows for baristas & kitchen staff between 10:00 AM and 11:00 PM
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                className={`btn btn-sm ${hourlyViewMode === 'revenue' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setHourlyViewMode('revenue')}
                style={{ fontWeight: 600 }}
              >
                Revenue (₹)
              </button>
              <button
                type="button"
                className={`btn btn-sm ${hourlyViewMode === 'orders' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setHourlyViewMode('orders')}
                style={{ fontWeight: 600 }}
              >
                Order Volume
              </button>
            </div>
          </div>

          {/* Peak Rushes Highlight Pills */}
          <div className="peak-callouts-grid">
            <div className="peak-pill-card">
              <div className="peak-pill-icon" style={{ background: '#ffedd5', color: '#ea580c' }}>
                <Flame size={22} />
              </div>
              <div className="peak-pill-details">
                <h4>Peak Lunch Rush</h4>
                <p>01:00 PM - 02:00 PM</p>
                <span>₹22,400 revenue (46 orders)</span>
              </div>
            </div>

            <div className="peak-pill-card">
              <div className="peak-pill-icon" style={{ background: '#f3e8ff', color: '#9333ea' }}>
                <Sparkles size={22} />
              </div>
              <div className="peak-pill-details">
                <h4>Evening Boba Peak</h4>
                <p>08:00 PM - 09:00 PM</p>
                <span>₹24,500 revenue (49 orders)</span>
              </div>
            </div>

            <div className="peak-pill-card">
              <div className="peak-pill-icon" style={{ background: '#ecfdf5', color: '#059669' }}>
                <TrendingUp size={22} />
              </div>
              <div className="peak-pill-details">
                <h4>Highest Average Ticket</h4>
                <p>02:00 PM (₹513 / ticket)</p>
                <span>Bulk group takeaway orders</span>
              </div>
            </div>
          </div>

          {/* Recharts Area / Bar Chart */}
          <div style={{ height: 380, width: '100%', marginTop: '1rem' }}>
            <ResponsiveContainer width="100%" height="100%">
              {hourlyViewMode === 'revenue' ? (
                <AreaChart data={MOCK_HOURLY_SALES} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="hour" tick={{ fontSize: 12, fill: '#64748b' }} stroke="#cbd5e1" dy={8} />
                  <YAxis
                    tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    stroke="#cbd5e1"
                    dx={-4}
                  />
                  <Tooltip
                    formatter={(val: unknown) => [formatINR(Number(val) || 0), 'Hourly Revenue']}
                    labelStyle={{ fontWeight: 700, color: '#0f172a' }}
                    contentStyle={{ borderRadius: 8, borderColor: '#e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#4f46e5"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#revenueGrad)"
                  />
                </AreaChart>
              ) : (
                <BarChart data={MOCK_HOURLY_SALES} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="hour" tick={{ fontSize: 12, fill: '#64748b' }} stroke="#cbd5e1" dy={8} />
                  <YAxis tick={{ fontSize: 12, fill: '#64748b' }} stroke="#cbd5e1" dx={-4} />
                  <Tooltip
                    formatter={(val: unknown) => [`${val} Orders`, 'Order Count']}
                    labelStyle={{ fontWeight: 700, color: '#0f172a' }}
                    contentStyle={{ borderRadius: 8, borderColor: '#e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                  />
                  <Bar dataKey="orders" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW C: ITEM-WISE SALES (THE MENU MATRIX)
          ========================================================================= */}
      {activeTab === 'item-matrix' && (
        <div className="report-card">
          <div className="report-card-header">
            <div>
              <h3 className="report-card-title">
                <ShoppingBag size={20} color="#4f46e5" />
                The Menu Matrix (Item-Wise Sales & Velocity)
              </h3>
              <p className="report-card-subtitle">
                Track top-performing bestsellers and flag low-velocity menu items for inventory optimization
              </p>
            </div>
          </div>

          {/* Search & Filters */}
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
            <div style={{ position: 'relative', flex: '1', minWidth: '240px' }}>
              <Search
                size={16}
                color="#94a3b8"
                style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
              />
              <input
                type="text"
                placeholder="Search items by name or category..."
                value={itemSearch}
                onChange={(e) => setItemSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.6rem 0.75rem 0.6rem 2.25rem',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.875rem',
                  outline: 'none',
                }}
              />
            </div>

            {/* Category Select Filter */}
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              {itemCategories.slice(0, 6).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={`btn btn-sm ${selectedCategory === cat ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setSelectedCategory(cat)}
                  style={{ fontSize: '0.75rem', fontWeight: 600 }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Sortable Data Table */}
          <div className="data-table-wrapper">
            <table className="reports-data-table">
              <thead>
                <tr>
                  <th className="sortable" onClick={() => handleSort('name')}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      Item Name <ArrowUpDown size={14} />
                    </div>
                  </th>
                  <th className="sortable" onClick={() => handleSort('category')}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      Category <ArrowUpDown size={14} />
                    </div>
                  </th>
                  <th className="sortable" onClick={() => handleSort('qtySold')}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      Quantity Sold <ArrowUpDown size={14} />
                    </div>
                  </th>
                  <th>Unit Price</th>
                  <th className="sortable" onClick={() => handleSort('totalRevenue')}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      Total Revenue <ArrowUpDown size={14} />
                    </div>
                  </th>
                  <th className="sortable" onClick={() => handleSort('foodCostPct')}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      Food Cost % <ArrowUpDown size={14} />
                    </div>
                  </th>
                  <th>Performance Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedItems.map((item: ItemMatrixRecord) => {
                  const isTop = top3Ids.has(item.id);
                  const isBottom = bottom3Ids.has(item.id);

                  return (
                    <tr key={item.id}>
                      <td style={{ fontWeight: 600, color: '#0f172a' }}>{item.name}</td>
                      <td>
                        <span className="badge-category">{item.category}</span>
                      </td>
                      <td style={{ fontWeight: 700 }}>{item.qtySold} units</td>
                      <td>{formatINR(item.unitPrice)}</td>
                      <td style={{ fontWeight: 700, color: '#0f172a' }}>{formatINR(item.totalRevenue)}</td>
                      <td>
                        <span
                          style={{
                            fontWeight: 600,
                            color: item.foodCostPct > 30 ? '#dc2626' : '#16a34a',
                          }}
                        >
                          {item.foodCostPct}%
                        </span>
                      </td>
                      <td>
                        {isTop && (
                          <span className="badge-top-seller">
                            <Award size={13} />
                            Top Seller
                          </span>
                        )}
                        {isBottom && (
                          <span className="badge-slow-seller">
                            <AlertTriangle size={13} />
                            Slow Moving
                          </span>
                        )}
                        {!isTop && !isBottom && (
                          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Normal Velocity</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW D: THE ANTI-FRAUD VOID LOG (SECURITY AUDIT)
          ========================================================================= */}
      {activeTab === 'void-log' && (
        <div className="report-card" style={{ borderColor: '#fca5a5' }}>
          {/* Security Banner */}
          <div className="void-audit-header-banner">
            <ShieldAlert size={28} style={{ flexShrink: 0 }} />
            <div>
              <h3>Security & Loss Prevention Audit Trail</h3>
              <p>
                Strict ledger tracking of all item cancellations, KOT voids, and supervisor override PINs.
                Sudden spikes in voids are automatically flagged for restaurant management review.
              </p>
            </div>
          </div>

          {/* Quick Void Metrics */}
          <div className="kpi-grid" style={{ marginBottom: '1.5rem' }}>
            <div className="kpi-card" style={{ borderLeft: '4px solid #dc2626' }}>
              <div className="kpi-card-header">
                <span className="kpi-card-title">Total Void Incidents</span>
                <ShieldAlert size={18} color="#dc2626" />
              </div>
              <div className="kpi-card-value">{MOCK_VOID_AUDIT_LOG.length}</div>
              <div className="kpi-card-subtitle">
                <span>Authorized by manager PIN</span>
              </div>
            </div>

            <div className="kpi-card" style={{ borderLeft: '4px solid #ef4444' }}>
              <div className="kpi-card-header">
                <span className="kpi-card-title">Total Voided Value</span>
                <TrendingDown size={18} color="#ef4444" />
              </div>
              <div className="kpi-card-value">
                {formatINR(MOCK_VOID_AUDIT_LOG.reduce((sum, item) => sum + item.amount, 0))}
              </div>
              <div className="kpi-card-subtitle">
                <span>1.2% of daily gross turnover</span>
              </div>
            </div>

            <div className="kpi-card" style={{ borderLeft: '4px solid #f59e0b' }}>
              <div className="kpi-card-header">
                <span className="kpi-card-title">Highest Void</span>
                <Flame size={18} color="#f59e0b" />
              </div>
              <div className="kpi-card-value">₹720</div>
              <div className="kpi-card-subtitle">
                <span>Takeaway Left Without Pick</span>
              </div>
            </div>
          </div>

          {/* Audit Data Table */}
          <div className="data-table-wrapper">
            <table className="reports-data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Order / Ref</th>
                  <th>Item Cancelled</th>
                  <th>Qty & Value</th>
                  <th>Original Waiter</th>
                  <th>Authorizing Manager</th>
                  <th>Cancellation Reason</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_VOID_AUDIT_LOG.map((record) => (
                  <tr key={record.id}>
                    <td style={{ fontWeight: 600, color: '#475569', fontSize: '0.8125rem' }}>
                      {record.time}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{record.orderNumber}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{record.tableNumber}</div>
                    </td>
                    <td style={{ fontWeight: 600, color: '#b91c1c' }}>{record.item}</td>
                    <td>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{formatINR(record.amount)}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Qty: {record.qty}</div>
                    </td>
                    <td style={{ color: '#334155', fontWeight: 500 }}>{record.originalWaiter}</td>
                    <td>
                      <span className="pin-masked-tag">PIN: {record.managerPin}</span>
                    </td>
                    <td>
                      <span className="reason-tag">{record.reason}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW E: GST & CA EXPORT MODULE
          ========================================================================= */}
      {activeTab === 'gst-export' && (
        <div className="report-card">
          <div className="report-card-header">
            <div>
              <h3 className="report-card-title">
                <FileSpreadsheet size={20} color="#4f46e5" />
                GST Statutory Returns & Chartered Accountant (CA) Exporter
              </h3>
              <p className="report-card-subtitle">
                1-click statutory GSTR-1 compliant exports formatted for direct import into ClearTax, Tally Prime, and GSTN Portal
              </p>
            </div>
          </div>

          {/* 3 Prominent Export Cards */}
          <div className="export-cards-grid">
            {/* Card 1: Table 7 */}
            <div className="export-action-card">
              <div>
                <div className="export-card-top">
                  <div className="export-card-icon">
                    <FileSpreadsheet size={22} />
                  </div>
                  <div className="export-card-info">
                    <h3>Export Table 7 (B2C Consolidated)</h3>
                    <p>Consolidated small supplies for direct consumer retail dining & takeaway under 5% GST rate.</p>
                    <span className="export-format-badge">GSTR-1 Format • Table 7</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="btn-export-download"
                onClick={handleExportTable7}
              >
                <Download size={16} />
                Download Table 7 CSV
              </button>
            </div>

            {/* Card 2: Section 9(5) */}
            <div className="export-action-card">
              <div>
                <div className="export-card-top">
                  <div className="export-card-icon" style={{ background: '#ffedd5', color: '#ea580c' }}>
                    <Download size={22} />
                  </div>
                  <div className="export-card-info">
                    <h3>Export Section 9(5) (Swiggy / Zomato)</h3>
                    <p>Segregated E-Commerce Operator deliveries where GST liability & TCS are deposited by ECO platforms.</p>
                    <span className="export-format-badge">GSTR-1 Format • Sec 9(5)</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="btn-export-download"
                style={{ background: '#ea580c' }}
                onClick={handleExportSection9_5}
              >
                <Download size={16} />
                Download Sec 9(5) CSV
              </button>
            </div>

            {/* Card 3: Table 12 */}
            <div className="export-action-card">
              <div>
                <div className="export-card-top">
                  <div className="export-card-icon" style={{ background: '#ecfdf5', color: '#059669' }}>
                    <FileSpreadsheet size={22} />
                  </div>
                  <div className="export-card-info">
                    <h3>Export Table 12 (HSN / SAC Summary)</h3>
                    <p>Consolidated SAC 996331 service code ledger with total tax, CGST (2.5%), and SGST (2.5%) amounts.</p>
                    <span className="export-format-badge">GSTR-1 Format • Table 12</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="btn-export-download"
                style={{ background: '#059669' }}
                onClick={handleExportTable12}
              >
                <Download size={16} />
                Download Table 12 CSV
              </button>
            </div>
          </div>

          {/* CA Summary Preview */}
          <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#334155', fontWeight: 700 }}>
              Audit Filing Preview (Current Tax Period)
            </h4>
            <div style={{ fontSize: '0.8125rem', color: '#64748b', lineHeight: 1.6 }}>
              • Total Taxable Turnover: <strong>₹1,52,800.00</strong><br />
              • Output Tax (CGST 2.5% + SGST 2.5%): <strong>₹7,640.00</strong><br />
              • Aggregator Turnover (ECO Sec 9(5)): <strong>₹59,000.00 (Swiggy + Zomato)</strong><br />
              • Direct Counter Turnover (Table 7): <strong>₹93,800.00</strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
