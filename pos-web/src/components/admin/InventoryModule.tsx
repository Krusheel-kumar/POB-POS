import React, { useState } from 'react';
import {
  Boxes,
  Utensils,
  Truck,
  Scale,
  AlertTriangle,
  Zap,
  CheckCircle2,
  ListOrdered,
} from 'lucide-react';
import { RecipeBuilder } from './inventory/RecipeBuilder';
import { StockTransferView } from './inventory/StockTransferView';
import { StockTakeView } from './inventory/StockTakeView';
import { VarianceReportView } from './inventory/VarianceReportView';
import { useInventoryStore } from '../../store/useInventoryStore';
import './InventoryModule.css';

type InventoryTab = 'recipes' | 'transfers' | 'stock-take' | 'variance' | 'ledger';

export const InventoryModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState<InventoryTab>('recipes');
  const [simToast, setSimToast] = useState<string | null>(null);

  const { depleteStockOnKot, ledger } = useInventoryStore();

  const handleSimulateKot = (name: string, items: { menuItemId: string; quantity: number }[]) => {
    const orderNum = `KOT-${Math.floor(1000 + Math.random() * 9000)}`;
    depleteStockOnKot(orderNum, items);
    setSimToast(`Simulated ${orderNum}: ${name}! Recipes auto-depleted branch ingredients.`);
    setTimeout(() => setSimToast(null), 3500);
  };

  return (
    <div className="inventory-container">
      {/* Toast Notification */}
      {simToast && (
        <div className="reports-toast" role="status">
          <CheckCircle2 size={20} className="toast-icon-success" />
          <span>{simToast}</span>
        </div>
      )}

      {/* Main Module Header */}
      <div className="inventory-header">
        <div className="inventory-header-top">
          <div className="inventory-header-title">
            <h2>
              <Boxes size={24} color="#0284c7" />
              Advanced Inventory, Recipes & Central Warehouse Management
            </h2>
            <p>
              End-to-end raw material tracking: Central Kitchen transfers, Recipe BOM auto-depletion per KOT, and Loss Prevention Variance Audits
            </p>
          </div>

          {/* Quick Demo Simulator Tool */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#f8fafc', padding: '0.4rem 0.8rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <Zap size={16} color="#eab308" />
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155' }}>Live KOT Auto-Deplete:</span>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() =>
                handleSimulateKot('10x Tiger Brown Sugar Boba', [{ menuItemId: 'prod-01', quantity: 10 }])
              }
              style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
            >
              Fire 10x Boba KOT
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() =>
                handleSimulateKot('5x Truffle Fries', [{ menuItemId: 'prod-04', quantity: 5 }])
              }
              style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
            >
              Fire 5x Fries KOT
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="inventory-tabs-nav" role="tablist">
          <button
            type="button"
            className={`inventory-tab-btn ${activeTab === 'recipes' ? 'active' : ''}`}
            onClick={() => setActiveTab('recipes')}
          >
            <Utensils size={16} />
            1. Recipe Builder (BOM)
          </button>
          <button
            type="button"
            className={`inventory-tab-btn ${activeTab === 'transfers' ? 'active' : ''}`}
            onClick={() => setActiveTab('transfers')}
          >
            <Truck size={16} />
            2. Stock Indent & Transfers (GRN)
          </button>
          <button
            type="button"
            className={`inventory-tab-btn ${activeTab === 'stock-take' ? 'active' : ''}`}
            onClick={() => setActiveTab('stock-take')}
          >
            <Scale size={16} />
            3. End-of-Day Stock Take
          </button>
          <button
            type="button"
            className={`inventory-tab-btn tab-danger ${activeTab === 'variance' ? 'active' : ''}`}
            onClick={() => setActiveTab('variance')}
          >
            <AlertTriangle size={16} />
            4. The Variance Report (&gt;3% Alert)
          </button>
          <button
            type="button"
            className={`inventory-tab-btn ${activeTab === 'ledger' ? 'active' : ''}`}
            onClick={() => setActiveTab('ledger')}
          >
            <ListOrdered size={16} />
            5. Immutable Stock Ledger ({ledger.length})
          </button>
        </div>
      </div>

      {/* Screen 1: Recipe Builder */}
      {activeTab === 'recipes' && <RecipeBuilder />}

      {/* Screen 2: Stock Transfer State Machine */}
      {activeTab === 'transfers' && <StockTransferView />}

      {/* Screen 3: End of Day Stock Take */}
      {activeTab === 'stock-take' && <StockTakeView />}

      {/* Screen 4: The Variance Report */}
      {activeTab === 'variance' && <VarianceReportView />}

      {/* Screen 5: Immutable Ledger View */}
      {activeTab === 'ledger' && (
        <div className="inv-card">
          <div className="inv-card-header">
            <div>
              <h3 className="inv-card-title">
                <ListOrdered size={20} color="#0284c7" />
                Immutable Stock Movement Ledger
              </h3>
              <p className="inv-card-subtitle">
                Cryptographic-style append-only physical transaction ledger tracking every SALE, GRN, TRANSFER, and ADJUSTMENT
              </p>
            </div>
          </div>

          <div className="inv-table-wrapper">
            <table className="inv-data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Outlet</th>
                  <th>Transaction Type</th>
                  <th>Raw Material</th>
                  <th>Quantity Change</th>
                  <th>UOM</th>
                  <th>Reference ID</th>
                  <th>Audit Notes</th>
                </tr>
              </thead>
              <tbody>
                {ledger.map((entry) => (
                  <tr key={entry.id}>
                    <td style={{ fontSize: '0.8125rem', color: '#64748b' }}>{entry.createdAt}</td>
                    <td style={{ fontWeight: 600 }}>{entry.outletId}</td>
                    <td>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px',
                          background:
                            entry.transactionType === 'SALE'
                              ? '#fef2f2'
                              : entry.transactionType === 'GRN'
                              ? '#ecfdf5'
                              : entry.transactionType === 'TRANSFER'
                              ? '#e0f2fe'
                              : '#f8fafc',
                          color:
                            entry.transactionType === 'SALE'
                              ? '#dc2626'
                              : entry.transactionType === 'GRN'
                              ? '#065f46'
                              : entry.transactionType === 'TRANSFER'
                              ? '#0369a1'
                              : '#334155',
                          border: '1px solid currentColor',
                        }}
                      >
                        {entry.transactionType}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600, color: '#0f172a' }}>{entry.rawMaterialName}</td>
                    <td style={{ fontWeight: 700 }}>
                      <span
                        style={{
                          color: entry.quantityChange > 0 ? '#16a34a' : '#dc2626',
                        }}
                      >
                        {entry.quantityChange > 0 ? `+${entry.quantityChange}` : entry.quantityChange}
                      </span>
                    </td>
                    <td>{entry.uom}</td>
                    <td>
                      <code style={{ background: '#f1f5f9', padding: '0.15rem 0.4rem', borderRadius: '4px' }}>
                        {entry.referenceId}
                      </code>
                    </td>
                    <td style={{ fontSize: '0.8125rem', color: '#475569' }}>{entry.notes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
