import React, { useState } from 'react';
import { Plus, Trash2, Save, Utensils, CheckCircle2 } from 'lucide-react';
import { useInventoryStore } from '../../../store/useInventoryStore';
import type { RecipeIngredient, VariantSize } from '../../../types/inventory';
import { formatINR } from '../../../lib/mockReportsData';

const MENU_ITEMS = [
  { id: 'prod-02', name: 'Authentic Boba Tea', priceRegular: 220, priceLarge: 270 },
  { id: 'prod-01', name: 'Tiger Brown Sugar Boba', priceRegular: 240, priceLarge: 290 },
  { id: 'prod-06', name: 'Velvet Cheese Foam Matcha', priceRegular: 260, priceLarge: 310 },
  { id: 'prod-04', name: 'Truffle Parmesan Fries', priceRegular: 220, priceLarge: 280 },
  { id: 'prod-03', name: 'Chicken Tikka Roll', priceRegular: 250, priceLarge: 310 },
];

export const RecipeBuilder: React.FC = () => {
  const { rawMaterials, recipes, saveSizeRecipe } = useInventoryStore();

  const [selectedMenuItemId, setSelectedMenuItemId] = useState<string>(MENU_ITEMS[0].id);
  const [activeSize, setActiveSize] = useState<VariantSize>('REGULAR');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const currentRecipe = recipes.find((r) => r.menuItemId === selectedMenuItemId);

  // Active ingredients for current size
  const [draftIngredients, setDraftIngredients] = useState<RecipeIngredient[]>(() => {
    if (currentRecipe) {
      return currentRecipe.sizes ? [...(currentRecipe.sizes[activeSize] || [])] : [...currentRecipe.ingredients];
    }
    return [];
  });

  // Switch Menu Item
  const handleSelectMenuItem = (menuItemId: string) => {
    setSelectedMenuItemId(menuItemId);
    const existing = recipes.find((r) => r.menuItemId === menuItemId);
    if (existing) {
      setDraftIngredients(existing.sizes ? [...(existing.sizes[activeSize] || [])] : [...existing.ingredients]);
    } else {
      setDraftIngredients([]);
    }
  };

  // Switch Size (Regular vs Large)
  const handleSwitchSize = (newSize: VariantSize) => {
    setActiveSize(newSize);
    const existing = recipes.find((r) => r.menuItemId === selectedMenuItemId);
    if (existing) {
      setDraftIngredients(existing.sizes ? [...(existing.sizes[newSize] || [])] : []);
    } else {
      setDraftIngredients([]);
    }
  };

  // Add row
  const handleAddIngredient = () => {
    const defaultMat = rawMaterials[0];
    setDraftIngredients([
      ...draftIngredients,
      {
        rawMaterialId: defaultMat.id,
        quantityConsumed: 10,
        uom: defaultMat.consumptionUom,
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

  // Calculate live food cost for current draft size
  const liveFoodCost = draftIngredients.reduce((total, ing) => {
    const mat = rawMaterials.find((m) => m.id === ing.rawMaterialId);
    return total + (mat ? ing.quantityConsumed * mat.costPerConsumptionUom : 0);
  }, 0);

  const selectedItemMeta = MENU_ITEMS.find((m) => m.id === selectedMenuItemId);

  // Recipe cost for both sizes side-by-side
  const regularCost = currentRecipe?.estimatedCost?.REGULAR || 42.64;
  const largeCost = currentRecipe?.estimatedCost?.LARGE || 68.36;

  const handleSave = () => {
    if (!selectedItemMeta) return;
    saveSizeRecipe(selectedItemMeta.id, selectedItemMeta.name, activeSize, draftIngredients);
    setSuccessToast(`Recipe for ${selectedItemMeta.name} [${activeSize}] saved successfully!`);
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

      {/* Header */}
      <div className="inv-card-header">
        <div>
          <h3 className="inv-card-title">
            <Utensils size={20} color="#0284c7" />
            Size-Based Recipe Builder (Bill of Materials - BOM)
          </h3>
          <p className="inv-card-subtitle">
            Configure raw material consumption for each glass size (Regular vs Large) with live food cost calculation
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={handleSave}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}
        >
          <Save size={16} /> Save Recipe ({activeSize})
        </button>
      </div>

      <div className="recipe-builder-layout">
        {/* Left: Menu Items Selector */}
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
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    Reg: {formatINR(item.priceRegular)} | Lrg: {formatINR(item.priceLarge)}
                  </div>
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

        {/* Right: Size Toggle & Ingredients Table */}
        <div>
          {/* Glass Type / Size Selector Tabs */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', background: '#f1f5f9', padding: '0.35rem', borderRadius: '8px' }}>
              <button
                type="button"
                className={`transfer-subtab-btn ${activeSize === 'REGULAR' ? 'active' : ''}`}
                onClick={() => handleSwitchSize('REGULAR')}
                style={{ fontWeight: 700 }}
              >
                🧋 Regular Glass (300ml)
              </button>
              <button
                type="button"
                className={`transfer-subtab-btn ${activeSize === 'LARGE' ? 'active' : ''}`}
                onClick={() => handleSwitchSize('LARGE')}
                style={{ fontWeight: 700 }}
              >
                🧋 Large Glass (500ml/700ml)
              </button>
            </div>

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleAddIngredient}
              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600 }}
            >
              <Plus size={15} /> Add Ingredient Row
            </button>
          </div>

          {/* Current Ingredients Table */}
          <div className="inv-table-wrapper">
            <table className="recipe-ingredients-table">
              <thead>
                <tr>
                  <th style={{ width: '38%' }}>Ingredient / Raw Material</th>
                  <th style={{ width: '22%' }}>Quantity for {activeSize}</th>
                  <th style={{ width: '15%' }}>UOM</th>
                  <th style={{ width: '15%' }}>Ingredient Cost</th>
                  <th style={{ width: '10%' }}></th>
                </tr>
              </thead>
              <tbody>
                {draftIngredients.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                      No ingredients configured for {activeSize} size. Click "Add Ingredient Row" to build recipe.
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
                          {ing.notes && (
                            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                              Note: {ing.notes}
                            </div>
                          )}
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

          {/* Size Comparison & Cost Breakdown */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1.25rem' }}>
            {/* Regular Summary Card */}
            <div
              style={{
                background: activeSize === 'REGULAR' ? '#f0fdf4' : '#f8fafc',
                border: activeSize === 'REGULAR' ? '2px solid #16a34a' : '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '1rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <strong style={{ fontSize: '0.9rem', color: '#0f172a' }}>Regular Glass (300ml)</strong>
                {activeSize === 'REGULAR' && (
                  <span style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 700 }}>● Editing Now</span>
                )}
              </div>
              <div style={{ fontSize: '0.8125rem', color: '#64748b', lineHeight: 1.6 }}>
                • Raw Food Cost: <strong>{formatINR(activeSize === 'REGULAR' ? liveFoodCost : regularCost, true)}</strong><br />
                • Selling Price: <strong>{formatINR(selectedItemMeta?.priceRegular || 220)}</strong><br />
                • Food Cost %: <strong>{((activeSize === 'REGULAR' ? liveFoodCost : regularCost) / (selectedItemMeta?.priceRegular || 220) * 100).toFixed(1)}%</strong>
              </div>
            </div>

            {/* Large Summary Card */}
            <div
              style={{
                background: activeSize === 'LARGE' ? '#f0fdf4' : '#f8fafc',
                border: activeSize === 'LARGE' ? '2px solid #16a34a' : '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '1rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <strong style={{ fontSize: '0.9rem', color: '#0f172a' }}>Large Glass (500ml)</strong>
                {activeSize === 'LARGE' && (
                  <span style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 700 }}>● Editing Now</span>
                )}
              </div>
              <div style={{ fontSize: '0.8125rem', color: '#64748b', lineHeight: 1.6 }}>
                • Raw Food Cost: <strong>{formatINR(activeSize === 'LARGE' ? liveFoodCost : largeCost, true)}</strong><br />
                • Selling Price: <strong>{formatINR(selectedItemMeta?.priceLarge || 270)}</strong><br />
                • Food Cost %: <strong>{((activeSize === 'LARGE' ? liveFoodCost : largeCost) / (selectedItemMeta?.priceLarge || 270) * 100).toFixed(1)}%</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
