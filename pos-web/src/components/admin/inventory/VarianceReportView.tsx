import React, { useState } from 'react';
import {
  AlertTriangle,
  TrendingDown,
  ShieldAlert,
  Search,
  CheckCircle,
  Download,
} from 'lucide-react';
import { useInventoryStore } from '../../../store/useInventoryStore';
import { formatINR } from '../../../lib/mockReportsData';

export const VarianceReportView: React.FC = () => {
  const { getVarianceReports } = useInventoryStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterRiskOnly, setFilterRiskOnly] = useState(false);

  const varianceList = getVarianceReports();

  const filteredList = varianceList.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());
    if (filterRiskOnly) {
      return matchesSearch && item.isHighVariance;
    }
    return matchesSearch;
  });

  // Calculate summary metrics
  const totalVarianceCostLoss = varianceList.reduce((sum, item) => {
    return item.varianceCost < 0 ? sum + Math.abs(item.varianceCost) : sum;
  }, 0);

  const highRiskCount = varianceList.filter((item) => item.isHighVariance).length;

  const topDiscrepancy = [...varianceList].sort(
    (a, b) => a.variancePct - b.variancePct
  )[0];

  const handleExportCSV = () => {
    const headers = 'Raw Material,Category,Opening Stock,Received (GRN),Theoretical POS Consumption,Expected Stock,Actual Physical Count,Missing Qty,Variance %,Variance Cost (INR)\n';
    const rows = varianceList.map((item) => {
      return `"${item.name}","${item.category}",${item.openingStock},${item.receivedStock},${item.theoreticalConsumption},${item.expectedStock},${item.actualPhysicalStock},${item.missingQty},"${item.variancePct}%",${item.varianceCost}`;
    }).join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Inventory_Variance_Audit_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="inv-card">
      <div className="inv-card-header">
        <div>
          <h3 className="inv-card-title">
            <AlertTriangle size={20} color="#dc2626" />
            The Variance Report (Loss Prevention & Theft Audit)
          </h3>
          <p className="inv-card-subtitle">
            Calculated as: <strong>Expected Stock = (Opening + Received) - Theoretical POS Consumption</strong> vs Actual Weighed Count
          </p>
        </div>

        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={handleExportCSV}
          style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <Download size={14} /> Export Variance CSV
        </button>
      </div>

      {/* Loss Prevention KPI Cards */}
      <div className="kpi-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="kpi-card" style={{ borderLeft: '4px solid #dc2626' }}>
          <div className="kpi-card-header">
            <span className="kpi-card-title">Financial Shortage Loss</span>
            <div className="kpi-card-icon" style={{ background: '#fee2e2', color: '#dc2626' }}>
              <TrendingDown size={18} />
            </div>
          </div>
          <div className="kpi-card-value" style={{ color: '#dc2626' }}>
            {formatINR(totalVarianceCostLoss, true)}
          </div>
          <div className="kpi-card-subtitle">
            <span>Direct raw material discrepancy</span>
          </div>
        </div>

        <div className="kpi-card" style={{ borderLeft: '4px solid #ea580c' }}>
          <div className="kpi-card-header">
            <span className="kpi-card-title">High Risk Materials (&gt; 3% Shortage)</span>
            <div className="kpi-card-icon" style={{ background: '#ffedd5', color: '#ea580c' }}>
              <ShieldAlert size={18} />
            </div>
          </div>
          <div className="kpi-card-value" style={{ color: '#ea580c' }}>
            {highRiskCount} Items Flagged
          </div>
          <div className="kpi-card-subtitle">
            <span>Requires manager investigation</span>
          </div>
        </div>

        <div className="kpi-card" style={{ borderLeft: '4px solid #0284c7' }}>
          <div className="kpi-card-header">
            <span className="kpi-card-title">Top Variance Shortage</span>
            <div className="kpi-card-icon" style={{ background: '#e0f2fe', color: '#0284c7' }}>
              <AlertTriangle size={18} />
            </div>
          </div>
          <div className="kpi-card-value" style={{ fontSize: '1.25rem' }}>
            {topDiscrepancy ? topDiscrepancy.name : 'None'}
          </div>
          <div className="kpi-card-subtitle">
            <span style={{ color: '#dc2626', fontWeight: 700 }}>
              {topDiscrepancy ? `${topDiscrepancy.variancePct}% (${topDiscrepancy.missingQty} ${topDiscrepancy.uom})` : ''}
            </span>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
        <div style={{ position: 'relative', flex: '1', minWidth: '240px' }}>
          <Search
            size={16}
            color="#94a3b8"
            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
          />
          <input
            type="text"
            className="inv-input"
            placeholder="Search raw material by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '2.25rem' }}
          />
        </div>

        <button
          type="button"
          className={`btn btn-sm ${filterRiskOnly ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setFilterRiskOnly(!filterRiskOnly)}
          style={{
            fontWeight: 700,
            background: filterRiskOnly ? '#dc2626' : undefined,
            borderColor: filterRiskOnly ? '#dc2626' : undefined,
          }}
        >
          {filterRiskOnly ? '✓ Showing High Variance Only (> 3%)' : 'Show High Risk Only (> 3%)'}
        </button>
      </div>

      {/* Variance Audit Data Table */}
      <div className="inv-table-wrapper">
        <table className="inv-data-table">
          <thead>
            <tr>
              <th>Raw Material / Ingredient</th>
              <th>Opening Balance</th>
              <th>Goods Received (GRN)</th>
              <th>POS Billed Usage</th>
              <th>Expected Stock</th>
              <th>Actual Physical Count</th>
              <th>Variance Qty</th>
              <th>Financial Loss (INR)</th>
              <th>Variance %</th>
              <th>Audit Flag</th>
            </tr>
          </thead>
          <tbody>
            {filteredList.map((item) => {
              return (
                <tr
                  key={item.rawMaterialId}
                  className={item.isHighVariance ? 'variance-high-alert-row' : ''}
                >
                  <td>
                    <strong style={{ color: '#0f172a' }}>{item.name}</strong>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      {item.category} • Cost: {formatINR(item.unitCost, true)}/{item.uom}
                    </div>
                  </td>
                  <td>{item.openingStock.toLocaleString()} {item.uom}</td>
                  <td style={{ color: item.receivedStock > 0 ? '#16a34a' : '#64748b', fontWeight: 600 }}>
                    {item.receivedStock > 0 ? `+${item.receivedStock.toLocaleString()}` : '0'} {item.uom}
                  </td>
                  <td style={{ color: item.theoreticalConsumption > 0 ? '#dc2626' : '#64748b', fontWeight: 600 }}>
                    {item.theoreticalConsumption > 0 ? `-${item.theoreticalConsumption.toLocaleString()}` : '0'} {item.uom}
                  </td>
                  <td style={{ fontWeight: 700, color: '#0f172a' }}>
                    {item.expectedStock.toLocaleString()} {item.uom}
                  </td>
                  <td style={{ fontWeight: 700, color: '#0369a1' }}>
                    {item.actualPhysicalStock.toLocaleString()} {item.uom}
                  </td>
                  <td>
                    {item.missingQty === 0 ? (
                      <span style={{ color: '#16a34a', fontWeight: 600 }}>0 {item.uom}</span>
                    ) : item.missingQty < 0 ? (
                      <strong style={{ color: '#dc2626' }}>
                        {item.missingQty.toLocaleString()} {item.uom}
                      </strong>
                    ) : (
                      <span style={{ color: '#2563eb', fontWeight: 600 }}>
                        +{item.missingQty.toLocaleString()} {item.uom}
                      </span>
                    )}
                  </td>
                  <td>
                    {item.varianceCost < 0 ? (
                      <span className="variance-loss-badge">
                        -{formatINR(Math.abs(item.varianceCost), true)}
                      </span>
                    ) : (
                      <span style={{ color: '#16a34a' }}>₹0.00</span>
                    )}
                  </td>
                  <td>
                    {item.isHighVariance ? (
                      <span className="variance-negative-high">
                        {item.variancePct.toFixed(2)}%
                      </span>
                    ) : item.variancePct < 0 ? (
                      <span style={{ color: '#d97706', fontWeight: 600 }}>
                        {item.variancePct.toFixed(2)}%
                      </span>
                    ) : (
                      <span className="variance-normal">
                        +{item.variancePct.toFixed(2)}%
                      </span>
                    )}
                  </td>
                  <td>
                    {item.isHighVariance ? (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          background: '#fef2f2',
                          color: '#991b1b',
                          border: '1px solid #fecaca',
                          borderRadius: '6px',
                          padding: '0.2rem 0.5rem',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                        }}
                      >
                        <AlertTriangle size={13} />
                        High Theft / Spoilage Alert (&gt; 3%)
                      </span>
                    ) : (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          background: '#f0fdf4',
                          color: '#166534',
                          border: '1px solid #bbf7d0',
                          borderRadius: '6px',
                          padding: '0.2rem 0.5rem',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                        }}
                      >
                        <CheckCircle size={13} />
                        Within Tolerance
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
