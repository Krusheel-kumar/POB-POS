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
  Store,
} from 'lucide-react';
import { MasterInventoryView } from './inventory/MasterInventoryView';
import { RecipeBuilder } from './inventory/RecipeBuilder';
import { MultiOutletComparisonView } from './inventory/MultiOutletComparisonView';
import { StockTransferView } from './inventory/StockTransferView';
import { StockTakeView } from './inventory/StockTakeView';
import { VarianceReportView } from './inventory/VarianceReportView';
import { useInventoryStore } from '../../store/useInventoryStore';
import './InventoryModule.css';

type InventoryTab =
  | 'master'
  | 'recipes'
  | 'multi-outlet'
  | 'transfers'
  | 'stock-take'
  | 'variance'
  | 'ledger';

export const InventoryModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState<InventoryTab>('master');
  const [simToast, setSimToast] = useState<string | null>(null);

  const { billOrderAtOutlet, ledger } = useInventoryStore();

  const handleSimulateKot = (
    name: string,
    outletId: string,
    items: { menuItemId: string; size: 'REGULAR' | 'LARGE'; quantity: number }[]
  ) => {
    const orderNum = `KOT-${Math.floor(1000 + Math.random() * 9000)}`;
    const res = billOrderAtOutlet(outletId, orderNum, items);
    setSimToast(`[${name}] ${res.message}`);
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
              Central Godown & Multi-Branch Inventory Management
            </h2>
            <p>
              Godown bulk stock, Drink & Food BOM Recipes (Regular vs Large), Branch transfers, and Sham Ka Hisaab (Daily Closing)
            </p>
          </div>

          {/* Quick Demo Simulator Tool */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#f8fafc', padding: '0.4rem 0.8rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <Zap size={16} color="#eab308" />
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155' }}>Quick POS Billing Demo:</span>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() =>
                handleSimulateKot('2x Authentic Boba (Regular)', 'outlet-01', [
                  { menuItemId: 'prod-02', size: 'REGULAR', quantity: 2 },
                ])
              }
              style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', color: '#0284c7', fontWeight: 700 }}
            >
              🥤 2x Boba (Reg) @ Outlet 1
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() =>
                handleSimulateKot('1x Authentic Boba (Large)', 'outlet-01', [
                  { menuItemId: 'prod-02', size: 'LARGE', quantity: 1 },
                ])
              }
              style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', color: '#16a34a', fontWeight: 700 }}
            >
              🥤 1x Boba (Large) @ Outlet 1
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="inventory-tabs-nav" role="tablist">
          <button
            type="button"
            className={`inventory-tab-btn ${activeTab === 'master' ? 'active' : ''}`}
            onClick={() => setActiveTab('master')}
          >
            <Boxes size={16} />
            1. Central Master Inventory (Godown Bulk Maal)
          </button>

          <button
            type="button"
            className={`inventory-tab-btn ${activeTab === 'recipes' ? 'active' : ''}`}
            onClick={() => setActiveTab('recipes')}
          >
            <Utensils size={16} />
            2. Size-Based Recipes & BOM (Per Cup Formula)
          </button>

          <button
            type="button"
            className={`inventory-tab-btn ${activeTab === 'multi-outlet' ? 'active' : ''}`}
            onClick={() => setActiveTab('multi-outlet')}
          >
            <Store size={16} />
            3. Multi-Outlet Comparison & Live Billing (Branch Stock)
          </button>

          <button
            type="button"
            className={`inventory-tab-btn ${activeTab === 'transfers' ? 'active' : ''}`}
            onClick={() => setActiveTab('transfers')}
          >
            <Truck size={16} />
            4. Stock Indents & Challan (Godown to Branch Transfer)
          </button>

          <button
            type="button"
            className={`inventory-tab-btn ${activeTab === 'stock-take' ? 'active' : ''}`}
            onClick={() => setActiveTab('stock-take')}
          >
            <Scale size={16} />
            5. Sham Ka Hisaab (End-of-Day Stock Take)
          </button>

          <button
            type="button"
            className={`inventory-tab-btn tab-danger ${activeTab === 'variance' ? 'active' : ''}`}
            onClick={() => setActiveTab('variance')}
          >
            <AlertTriangle size={16} />
            6. Variance Report & Wastage (Nuksan / Chori Check &gt;3%)
          </button>

          <button
            type="button"
            className={`inventory-tab-btn ${activeTab === 'ledger' ? 'active' : ''}`}
            onClick={() => setActiveTab('ledger')}
          >
            <ListOrdered size={16} />
            7. Immutable Stock Ledger (Audit Khata) ({ledger.length})
          </button>
        </div>
      </div>

      {/* Screen 1: Central Master Inventory */}
      {activeTab === 'master' && <MasterInventoryView />}

      {/* Screen 2: Size-Based Recipe Builder */}
      {activeTab === 'recipes' && <RecipeBuilder />}

      {/* Screen 3: Multi-Outlet Comparison & Billing Simulator */}
      {activeTab === 'multi-outlet' && <MultiOutletComparisonView />}

      {/* Screen 4: Stock Indents & Transfer Pipeline */}
      {activeTab === 'transfers' && <StockTransferView />}

      {/* Screen 5: End of Day Stock Take */}
      {activeTab === 'stock-take' && <StockTakeView />}

      {/* Screen 6: Variance Report */}
      {activeTab === 'variance' && <VarianceReportView />}

      {/* Screen 7: Immutable Ledger */}
      {activeTab === 'ledger' && (
        <div className="inv-card">
          <div className="inv-card-header">
            <div>
              <h3 className="inv-card-title">
                <ListOrdered size={20} color="#0284c7" />
                Immutable Stock Movement Ledger
              </h3>
              <p className="inv-card-subtitle">
                Cryptographic-style append-only physical transaction ledger tracking every SALE, GRN, TRANSFER, and RESTOCK
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
                              : entry.transactionType === 'MASTER_RESTOCK'
                              ? '#f0fdf4'
                              : '#f8fafc',
                          color:
                            entry.transactionType === 'SALE'
                              ? '#dc2626'
                              : entry.transactionType === 'GRN'
                              ? '#065f46'
                              : entry.transactionType === 'TRANSFER'
                              ? '#0369a1'
                              : entry.transactionType === 'MASTER_RESTOCK'
                              ? '#15803d'
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
