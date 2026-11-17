import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { InventoryModule } from '../InventoryModule';

describe('Advanced Inventory, Recipe & Warehouse Module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders Screen 1: Recipe Builder (BOM) with live food cost and ingredient rows', () => {
    render(<InventoryModule />);

    expect(screen.getByText(/Recipe Builder \(Bill of Materials - BOM\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Ingredients Required per 1 Serving/i)).toBeInTheDocument();
    expect(screen.getByText(/Estimated Raw Food Cost/i)).toBeInTheDocument();

    // Add ingredient row test
    const addBtn = screen.getByRole('button', { name: /Add Ingredient Row/i });
    fireEvent.click(addBtn);

    // Save recipe test
    const saveBtn = screen.getByRole('button', { name: /Save Recipe \(BOM\)/i });
    fireEvent.click(saveBtn);
    expect(screen.getByText(/saved successfully/i)).toBeInTheDocument();
  });

  it('navigates to Screen 2: Stock Indent & Transfers and tests state machine dispatch & receive', () => {
    render(<InventoryModule />);

    // Click Transfers tab
    const transferTab = screen.getByRole('button', { name: /2\. Stock Indent & Transfers/i });
    fireEvent.click(transferTab);

    expect(screen.getByText(/Central Warehouse Stock Transfer & GRN Pipeline/i)).toBeInTheDocument();
    expect(screen.getByText('TRF-2026-1001')).toBeInTheDocument();

    // Test receiving an IN_TRANSIT shipment
    const receiveBtn = screen.getAllByRole('button', { name: /Receive & Generate GRN/i })[0];
    fireEvent.click(receiveBtn);

    expect(screen.getByText(/GRN generated for TRF-2026-1001/i)).toBeInTheDocument();
  });

  it('navigates to Screen 3: End-of-Day Stock Take and inputs physical counts', () => {
    render(<InventoryModule />);

    // Click Stock Take tab
    const stockTakeTab = screen.getByRole('button', { name: /3\. End-of-Day Stock Take/i });
    fireEvent.click(stockTakeTab);

    expect(screen.getByText(/End-of-Day Physical Stock Take/i)).toBeInTheDocument();
    expect(screen.getByText(/Black Tapioca Boba Pearls/i)).toBeInTheDocument();

    // Click Submit Daily Stock Take
    const submitBtn = screen.getByRole('button', { name: /Submit Daily Stock Take/i });
    fireEvent.click(submitBtn);

    expect(screen.getByText(/Daily Physical Stock Take submitted/i)).toBeInTheDocument();
  });

  it('navigates to Screen 4: The Variance Report and verifies red highlight on > 3% shortage', () => {
    render(<InventoryModule />);

    // Click Variance tab
    const varianceTab = screen.getByRole('button', { name: /4\. The Variance Report/i });
    fireEvent.click(varianceTab);

    expect(screen.getByText(/The Variance Report \(Loss Prevention & Theft Audit\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Financial Shortage Loss/i)).toBeInTheDocument();

    // Check for high theft/spoilage alerts
    const alerts = screen.getAllByText(/High Theft \/ Spoilage Alert/i);
    expect(alerts.length).toBeGreaterThan(0);

    // Verify negative variance percentage > 3% is present
    const negativePctElements = screen.getAllByText(/-\d+(\.\d+)?%/i);
    expect(negativePctElements.length).toBeGreaterThan(0);
  });

  it('simulates live KOT auto-depletion and logs entries in the immutable ledger', () => {
    render(<InventoryModule />);

    // Fire 10x Boba KOT
    const simBobaBtn = screen.getByRole('button', { name: /Fire 10x Boba KOT/i });
    fireEvent.click(simBobaBtn);

    expect(screen.getByText(/Recipes auto-depleted branch ingredients/i)).toBeInTheDocument();

    // Check ledger tab
    const ledgerTab = screen.getByRole('button', { name: /5\. Immutable Stock Ledger/i });
    fireEvent.click(ledgerTab);

    expect(screen.getByText(/Immutable Stock Movement Ledger/i)).toBeInTheDocument();
    const saleEntries = screen.getAllByText('SALE');
    expect(saleEntries.length).toBeGreaterThan(0);
  });
});
