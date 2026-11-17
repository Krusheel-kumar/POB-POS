import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ReportsDashboard } from './ReportsDashboard';

// Mock recharts responsive container for jsdom test environment
vi.mock('recharts', async () => {
  const actual = await vi.importActual<typeof import('recharts')>('recharts');
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="responsive-container" style={{ width: 800, height: 400 }}>
        {children}
      </div>
    ),
  };
});

describe('ReportsDashboard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders View A: The Z-Report by default with KPI cards and payment breakdown', () => {
    render(<ReportsDashboard />);

    // Title
    expect(screen.getByText(/Reports & Business Intelligence/i)).toBeInTheDocument();

    // Check KPI Cards
    expect(screen.getByText(/Gross Revenue/i)).toBeInTheDocument();
    expect(screen.getAllByText(/₹1,68,450/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('342')).toBeInTheDocument();
    expect(screen.getByText(/Average Order Value/i)).toBeInTheDocument();
    expect(screen.getByText(/Tax Collected \(GST 5%\)/i)).toBeInTheDocument();

    // Payment Settlement Breakdown
    expect(screen.getByText(/Payment Settlement Breakdown/i)).toBeInTheDocument();
    expect(screen.getByText(/UPI \/ QR Scan/i)).toBeInTheDocument();
    expect(screen.getByText(/Swiggy Online/i)).toBeInTheDocument();
  });

  it('navigates to View B: Hourly Sales & Rush Heatmap and displays peak rush callouts', () => {
    render(<ReportsDashboard />);

    // Click Hourly tab
    const hourlyTabBtn = screen.getByRole('button', { name: /Hourly Sales/i });
    fireEvent.click(hourlyTabBtn);

    expect(screen.getByText(/Peak Lunch Rush/i)).toBeInTheDocument();
    expect(screen.getByText(/01:00 PM - 02:00 PM/i)).toBeInTheDocument();
    expect(screen.getByText(/Evening Boba Peak/i)).toBeInTheDocument();
    expect(screen.getByText(/08:00 PM - 09:00 PM/i)).toBeInTheDocument();
  });

  it('navigates to View C: Menu Item Sales Matrix and supports search and badges', () => {
    render(<ReportsDashboard />);

    // Click Item Matrix tab
    const itemMatrixTabBtn = screen.getByRole('button', { name: /Menu Item Sales Matrix/i });
    fireEvent.click(itemMatrixTabBtn);

    expect(screen.getByText(/The Menu Matrix/i)).toBeInTheDocument();

    // Check Top Seller badge for Tiger Brown Sugar Boba
    expect(screen.getByText(/Tiger Brown Sugar Boba/i)).toBeInTheDocument();
    const topSellerBadges = screen.getAllByText(/Top Seller/i);
    expect(topSellerBadges.length).toBeGreaterThan(0);

    // Search filter test
    const searchInput = screen.getByPlaceholderText(/Search items by name or category/i);
    fireEvent.change(searchInput, { target: { value: 'Croissant' } });

    expect(screen.getByText(/Butter Croissant/i)).toBeInTheDocument();
    expect(screen.queryByText(/Chicken Tikka Roll/i)).not.toBeInTheDocument();
  });

  it('navigates to View D: Anti-Fraud Void Audit Log and displays security warnings', () => {
    render(<ReportsDashboard />);

    // Click Void Log tab
    const voidLogTabBtn = screen.getByRole('button', { name: /Anti-Fraud Void/i });
    fireEvent.click(voidLogTabBtn);

    expect(screen.getByText(/Security & Loss Prevention Audit Trail/i)).toBeInTheDocument();
    expect(screen.getByText(/Total Void Incidents/i)).toBeInTheDocument();
    expect(screen.getByText(/Customer Changed Mind/i)).toBeInTheDocument();
    expect(screen.getByText(/Wrong Item Punched on POS/i)).toBeInTheDocument();
  });

  it('navigates to View E: GST & CA Export Module and triggers CSV export with Toast', () => {
    render(<ReportsDashboard />);

    // Mock URL.createObjectURL and URL.revokeObjectURL
    const mockCreateObjectURL = vi.fn().mockReturnValue('blob:mock-url');
    const mockRevokeObjectURL = vi.fn();
    window.URL.createObjectURL = mockCreateObjectURL;
    window.URL.revokeObjectURL = mockRevokeObjectURL;

    // Click GST tab
    const gstTabBtn = screen.getByRole('button', { name: /GST & CA Export/i });
    fireEvent.click(gstTabBtn);

    expect(screen.getByText(/GST Statutory Returns/i)).toBeInTheDocument();
    expect(screen.getByText(/Export Table 7 \(B2C Consolidated\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Export Section 9\(5\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Export Table 12/i)).toBeInTheDocument();

    // Click Export Table 7 button
    const downloadBtn = screen.getByRole('button', { name: /Download Table 7 CSV/i });
    fireEvent.click(downloadBtn);

    expect(mockCreateObjectURL).toHaveBeenCalled();
    // Toast notification check
    expect(screen.getByText(/GSTR-1 Table 7 \(B2C Consolidated\) CSV Downloaded/i)).toBeInTheDocument();
  });

  it('navigates to Settled Invoices & Sales Register, tests timeline filtering and omni-search', () => {
    render(<ReportsDashboard />);

    // Click Sales Register tab
    const salesTabBtn = screen.getByRole('button', { name: /Settled Invoices/i });
    fireEvent.click(salesTabBtn);

    expect(screen.getByText(/Settled Invoices & Real-Time Sales Register/i)).toBeInTheDocument();
    expect(screen.getByText(/Filtered Revenue/i)).toBeInTheDocument();
    expect(screen.getByText(/Total Invoices/i)).toBeInTheDocument();

    // Verify timeline preset buttons exist
    expect(screen.getByRole('button', { name: 'Today' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Yesterday' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Last 7 Days' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'This Month' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'All Time' })).toBeInTheDocument();

    // Switch timeline to All Time
    fireEvent.click(screen.getByRole('button', { name: 'All Time' }));
    expect(screen.getByText(/INV-2026-095/i)).toBeInTheDocument();

    // Test Search input
    const searchInput = screen.getByPlaceholderText(/Search Invoice #/i);
    fireEvent.change(searchInput, { target: { value: 'Ananya' } });
    expect(screen.getByText(/Ananya Sharma/i)).toBeInTheDocument();

    // Verify slip view button exists
    expect(screen.getAllByRole('button', { name: /View Slip/i }).length).toBeGreaterThanOrEqual(1);
  });
});

