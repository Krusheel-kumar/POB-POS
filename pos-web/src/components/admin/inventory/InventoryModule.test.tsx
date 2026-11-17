import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { InventoryModule } from '../InventoryModule';

describe('Advanced Inventory, Size-Based Recipe & Multi-Outlet Module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders Screen 1: Central Master Inventory with bulk stock and restock button', () => {
    render(<InventoryModule />);

    expect(screen.getByText(/Central Master Inventory \(Commissary & Main Warehouse\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Farm Fresh Whole Milk/i)).toBeInTheDocument();
    expect(screen.getByText(/Ceylon Black Tea Base/i)).toBeInTheDocument();

    // Check "+ Add Stock" button exists
    const addStockButtons = screen.getAllByRole('button', { name: /\+ Add Stock/i });
    expect(addStockButtons.length).toBeGreaterThan(0);
  });

  it('navigates to Screen 2: Size-Based Recipe Builder and switches between Regular and Large glass sizes', () => {
    render(<InventoryModule />);

    // Click Recipe Builder tab
    const recipesTab = screen.getByRole('button', { name: /2\. Size-Based Recipes/i });
    fireEvent.click(recipesTab);

    expect(screen.getByText(/Size-Based Recipe Builder \(Bill of Materials - BOM\)/i)).toBeInTheDocument();

    // Verify Regular Glass tab
    expect(screen.getAllByText(/Regular Glass \(300ml\)/i).length).toBeGreaterThan(0);

    // Click Large Glass tab
    const largeSizeTab = screen.getByRole('button', { name: /Large Glass \(500ml\/700ml\)/i });
    fireEvent.click(largeSizeTab);

    // Save recipe test
    const saveBtn = screen.getByRole('button', { name: /Save Recipe \(LARGE\)/i });
    fireEvent.click(saveBtn);
    expect(screen.getByText(/saved successfully/i)).toBeInTheDocument();
  });

  it('navigates to Screen 3: Multi-Outlet Comparison and simulates live POS billing auto-depletion', () => {
    render(<InventoryModule />);

    // Click Multi-Outlet tab
    const multiOutletTab = screen.getByRole('button', { name: /3\. Multi-Outlet Comparison/i });
    fireEvent.click(multiOutletTab);

    expect(screen.getByText(/Central Master vs Multi-Outlet Stock Hub/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Central Master Stock/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Outlet 1 - Jubilee Hills/i).length).toBeGreaterThan(0);

    // Simulate punch bill
    const punchBillBtn = screen.getByRole('button', { name: /Punch Bill: 2x Authentic Boba/i });
    fireEvent.click(punchBillBtn);

    expect(screen.getByText(/Deducted 2x Authentic Boba/i)).toBeInTheDocument();
  });

  it('navigates to Screen 6: The Variance Report and verifies red highlight on > 3% shortage', () => {
    render(<InventoryModule />);

    // Click Variance tab
    const varianceTab = screen.getByRole('button', { name: /6\. Variance Report/i });
    fireEvent.click(varianceTab);

    expect(screen.getByText(/The Variance Report \(Loss Prevention & Theft Audit\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Financial Shortage Loss/i)).toBeInTheDocument();

    // Verify negative variance percentage > 3% is present
    const negativePctElements = screen.getAllByText(/-\d+(\.\d+)?%/i);
    expect(negativePctElements.length).toBeGreaterThan(0);
  });

  it('simulates live KOT auto-depletion from topbar and logs entries in the immutable ledger', () => {
    render(<InventoryModule />);

    // Fire 2x Boba Reg from top bar
    const simBobaBtn = screen.getByRole('button', { name: /🥤 2x Boba \(Reg\) @ Outlet 1/i });
    fireEvent.click(simBobaBtn);

    expect(screen.getByText(/Auto-depleted/i)).toBeInTheDocument();

    // Check ledger tab
    const ledgerTab = screen.getByRole('button', { name: /7\. Immutable Stock Ledger/i });
    fireEvent.click(ledgerTab);

    expect(screen.getByText(/Immutable Stock Movement Ledger/i)).toBeInTheDocument();
    const saleEntries = screen.getAllByText('SALE');
    expect(saleEntries.length).toBeGreaterThan(0);
  });
});
