import React, { useState } from 'react';
import { Plus, Trash2, Save, Utensils, CheckCircle2 } from 'lucide-react';
import { useInventoryStore } from '../../../store/useInventoryStore';
import type { RecipeIngredient } from '../../../types/inventory';
import { formatINR } from '../../../lib/mockReportsData';

const MENU_ITEMS = [
  { id: 'prod-01', name: 'Tiger Brown Sugar Boba', price: 240 },
  { id: 'prod-02', name: 'Authentic Ceylon Milk Tea', price: 249 },
  { id: 'prod-06', name: 'Velvet Cheese Foam Matcha', price: 260 },
  { id: 'prod-04', name: 'Truffle Parmesan Fries', price: 220 },
  { id: 'prod-03', name: 'Chicken Tikka Roll', price: 250 },
];

export const RecipeBuilder: React.FC = () => {
  const { rawMaterials, recipes, saveRecipe } = useInventoryStore();

  const [selectedMenuItemId, setSelectedMenuItemId] = useState<string>(MENU_ITEMS[0].id);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Get current active recipe or create default structure
  const currentRecipe = recipes.find((r) => r.menuItemId === selectedMenuItemId);
  const [draftIngredients, setDraftIngredients] = useState<RecipeIngredient[]>(() => {
    return currentRecipe ? [...currentRecipe.ingredients] : [];
  });

  // Switch menu item
  const handleSelectMenuItem = (menuItemId: string) => {
    setSelectedMenuItemId(menuItemId);
    const existing = recipes.find((r) => r.menuItemId === menuItemId);
    setDraftIngredients(existing ? [...existing.ingredients] : []);
  };

  // Add ingredient row
  const handleAddIngredient = () => {
    const firstMaterial = rawMaterials[0];
    setDraftIngredients([
      ...draftIngredients,
      {
        rawMaterialId: firstMaterial.id,
        quantityConsumed: 10,
        uom: firstMaterial.consumptionUom,
        notes: '',
      },
    ]);
  };

  // Remove row
  const handleRemoveIngredient = (index: number) => {
    setDraftIngredients(draftIngredients.filter((_, i) => i !== index));
  };

  // Update row
  const handleUpdateIngredient = (index: number, field: keyof RecipeIngredient, value: unknown) => {
    const updated = [...draftIngredients];
    if (field === 'rawMaterialId') {
      const mat = rawMaterials.find((m) => m.id === value);
      updated[index] = {
        ...updated[index],
        rawMaterialId: value as string,
        uom: mat?.consumptionUom || 'GRAM',
      };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    setDraftIngredients(updated);
  };

  // Calculate live food cost
  const liveFoodCost = draftIngredients.reduce((total, ing) => {
    const mat = rawMaterials.find((m) => m.id === ing.rawMaterialId);
    if (mat) {
      return total + ing.quantityConsumed * mat.costPerConsumptionUom;
    }
    return total;
  }, 0);

  const selectedItemMeta = MENU_ITEMS.find((m) => m.id === selectedMenuItemId);
  const sellingPrice = selectedItemMeta?.price || 200;
  const foodCostPct = sellingPrice > 0 ? (liveFoodCost / sellingPrice) * 100 : 0;
  const grossMargin = sellingPrice - liveFoodCost;

  const handleSave = () => {
    if (!selectedItemMeta) return;
    saveRecipe(selectedItemMeta.id, selectedItemMeta.name, draftIngredients);
    setSuccessToast(`Recipe for "${selectedItemMeta.name}" saved successfully!`);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  return (
    <div className="inv-card">
      {successToast && (
        <div className="reports-toast" role="status">
          <CheckCircle2 size={20} className="toast-icon-success" />
          <span>{successToast}</span>
        </div>
      )}

      <div className="inv-card-header">
        <div>
          <h3 className="inv-card-title">
            <Utensils size={20} color="#0284c7" />
            Recipe Builder (Bill of Materials - BOM)
          </h3>
          <p className="inv-card-subtitle">
            Map menu items to raw materials for automatic KOT stock depletion and precise gross margin analysis
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={handleSave}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}
        >
          <Save size={16} /> Save Recipe (BOM)
        </button>
      </div>

      <div className="recipe-builder-layout">
        {/* Left: Menu Item Selector */}
        <div className="recipe-menu-selector">
          <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
            Select Menu Item
          </span>
          {MENU_ITEMS.map((item) => {
            const hasRecipe = recipes.some((r) => r.menuItemId === item.id);
            const isSelected = item.id === selectedMenuItemId;
            return (
              <button
                key={item.id}
                type="button"
                className={`recipe-menu-item-btn ${isSelected ? 'active' : ''}`}
                onClick={() => handleSelectMenuItem(item.id)}
              >
                <div>
                  <div style={{ fontWeight: 600 }}>{item.name}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Selling Price: {formatINR(item.price)}</div>
                </div>
                {hasRecipe ? (
                  <span style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 700 }}>✓ Configured</span>
                ) : (
                  <span style={{ fontSize: '0.75rem', color: '#eab308' }}>● Unset</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Right: Ingredient Rows & Dynamic BOM */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
              Ingredients Required per 1 Serving of {selectedItemMeta?.name}
            </h4>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleAddIngredient}
              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600 }}
            >
              <Plus size={15} /> Add Ingredient Row
            </button>
          </div>

          <div className="inv-table-wrapper">
            <table className="recipe-ingredients-table">
              <thead>
                <tr>
                  <th style={{ width: '40%' }}>Raw Material</th>
                  <th style={{ width: '25%' }}>Quantity Consumed</th>
                  <th style={{ width: '15%' }}>UOM</th>
                  <th style={{ width: '15%' }}>Ingredient Cost</th>
                  <th style={{ width: '5%' }}></th>
                </tr>
              </thead>
              <tbody>
                {draftIngredients.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                      No raw materials linked yet. Click "Add Ingredient Row" to build the BOM.
                    </td>
                  </tr>
                ) : (
                  draftIngredients.map((ing, idx) => {
                    const mat = rawMaterials.find((m) => m.id === ing.rawMaterialId);
                    const cost = mat ? ing.quantityConsumed * mat.costPerConsumptionUom : 0;

                    return (
                      <tr key={idx}>
                        <td>
                          <select
                            className="inv-select"
                            value={ing.rawMaterialId}
                            onChange={(e) => handleUpdateIngredient(idx, 'rawMaterialId', e.target.value)}
                          >
                            {rawMaterials.map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.name} ({m.consumptionUom})
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <input
                            type="number"
                            min="0.1"
                            step="any"
                            className="inv-input"
                            value={ing.quantityConsumed}
                            onChange={(e) =>
                              handleUpdateIngredient(idx, 'quantityConsumed', parseFloat(e.target.value) || 0)
                            }
                          />
                        </td>
                        <td>
                          <span style={{ fontWeight: 600, color: '#475569' }}>{ing.uom}</span>
                        </td>
                        <td style={{ fontWeight: 700, color: '#0f172a' }}>{formatINR(cost, true)}</td>
                        <td>
                          <button
                            type="button"
                            onClick={() => handleRemoveIngredient(idx)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#ef4444',
                              cursor: 'pointer',
                              padding: '4px',
                            }}
                            title="Remove Ingredient"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Real-Time Food Cost Summary */}
          <div className="recipe-cost-summary-box">
            <div className="recipe-cost-stat">
              <span>Estimated Raw Food Cost</span>
              <strong>{formatINR(liveFoodCost, true)}</strong>
            </div>
            <div className="recipe-cost-stat">
              <span>Menu Selling Price</span>
              <strong style={{ color: '#0f172a' }}>{formatINR(sellingPrice)}</strong>
            </div>
            <div className="recipe-cost-stat">
              <span>Gross Margin per Order</span>
              <strong style={{ color: '#0284c7' }}>{formatINR(grossMargin, true)}</strong>
            </div>
            <div className="recipe-cost-stat">
              <span>Food Cost %</span>
              <strong style={{ color: foodCostPct > 35 ? '#dc2626' : '#16a34a' }}>
                {foodCostPct.toFixed(1)}%
              </strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
