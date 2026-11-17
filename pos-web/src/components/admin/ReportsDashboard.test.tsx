import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ReportsDashboard } from './ReportsDashboard';
import type { Bill } from '../../types/pos';

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

const sampleTestBills: Bill[] = [
  {
    id: 'bill-test-1',
    orderId: 'ord-test-1',
    invoiceNumber: 'POB-TEST-001',
    subtotal: 940,
    discountAmount: 0,
    taxableAmount: 940,
    cgstAmount: 23.5,
    sgstAmount: 23.5,
    taxAmount: 47,
    totalAmount: 987,
    paidAmount: 987,
    status: 'PAID',
    customerName: 'Ananya Sharma',
    customerPhone: '98450 12345',
    payments: [
      {
        id: 'pmt-1',
        amount: 987,
        paymentMethod: 'UPI',
        status: 'SUCCESSFUL',
        createdAt: new Date().toISOString(),
      },
    ],
    order: {
      id: 'ord-test-1',
      orderNumber: 'ORD-TEST-001',
      orderType: 'DINE_IN',
      customerName: 'Ananya Sharma',
      customerPhone: '98450 12345',
      tableNumber: 'T4',
      items: [
        {
          id: 'item-1',
          productId: 'prod-boba-1',
          productNameSnapshot: 'Tiger Brown Sugar Boba',
          quantity: 2,
          unitPriceSnapshot: 350,
          lineTotalSnapshot: 700,
        },
        {
          id: 'item-2',
          productId: 'prod-croissant',
          productNameSnapshot: 'Butter Croissant',
          quantity: 1,
          unitPriceSnapshot: 240,
          lineTotalSnapshot: 240,
        },
      ],
    },
    createdAt: new Date().toISOString(),
  },
];

describe('ReportsDashboard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders View A: The Z-Report with real KPI cards and payment breakdown from live bills', () => {
    render(<ReportsDashboard bills={sampleTestBills} />);

    // Title
    expect(screen.getByText(/Reports & Analytics/i)).toBeInTheDocument();

    // Check KPI Cards
    expect(screen.getByText(/Gross Revenue/i)).toBeInTheDocument();
    expect(screen.getAllByText(/₹940/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText(/Average Order Value/i)).toBeInTheDocument();
    expect(screen.getByText(/Tax Collected \(GST 5%\)/i)).toBeInTheDocument();

    // Payment Settlement Breakdown
    expect(screen.getByText(/Payment Settlement Breakdown/i)).toBeInTheDocument();
    expect(screen.getByText(/UPI \/ QR Scan/i)).toBeInTheDocument();
  });

  it('renders clean zero state when no bills are checked out yet', () => {
    render(<ReportsDashboard bills={[]} />);

    expect(screen.getByText(/Gross Revenue/i)).toBeInTheDocument();
    expect(screen.getAllByText(/₹0/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('0').length).toBeGreaterThanOrEqual(1);
  });

  it('navigates to View B: Hourly Sales & Rush Heatmap and displays dynamic hour callouts', () => {
    render(<ReportsDashboard bills={sampleTestBills} />);

    // Click Hourly tab
    const hourlyTabBtn = screen.getByRole('button', { name: /Hourly Sales/i });
    fireEvent.click(hourlyTabBtn);

    expect(screen.getByText(/Peak Revenue Hour/i)).toBeInTheDocument();
    expect(screen.getByText(/Order Volume Velocity/i)).toBeInTheDocument();
    expect(screen.getByText(/Highest Average Ticket/i)).toBeInTheDocument();
  });

  it('navigates to View C: Menu Item Sales Matrix and supports search from real checked-out items', () => {
    render(<ReportsDashboard bills={sampleTestBills} />);

    // Click Item Matrix tab
    const itemMatrixTabBtn = screen.getByRole('button', { name: /Item Sales/i });
    fireEvent.click(itemMatrixTabBtn);

    expect(screen.getByText(/The Menu Matrix/i)).toBeInTheDocument();

    // Check items from real checked-out order
    expect(screen.getByText(/Tiger Brown Sugar Boba/i)).toBeInTheDocument();
    expect(screen.getByText(/Butter Croissant/i)).toBeInTheDocument();

    // Search filter test
    const searchInput = screen.getByPlaceholderText(/Search items by name or category/i);
    fireEvent.change(searchInput, { target: { value: 'Croissant' } });

    expect(screen.getByText(/Butter Croissant/i)).toBeInTheDocument();
    expect(screen.queryByText(/Tiger Brown Sugar Boba/i)).not.toBeInTheDocument();
  });

  it('navigates to View D: Anti-Fraud Void Audit Log and displays security banner', () => {
    render(<ReportsDashboard bills={sampleTestBills} />);

    // Click Void Log tab
    const voidLogTabBtn = screen.getByRole('button', { name: /Void Audit/i });
    fireEvent.click(voidLogTabBtn);

    expect(screen.getByText(/Security & Loss Prevention Audit Trail/i)).toBeInTheDocument();
    expect(screen.getByText(/Total Void Incidents/i)).toBeInTheDocument();
  });

  it('navigates to View E: GST & CA Export Module and triggers CSV export with Toast', () => {
    render(<ReportsDashboard bills={sampleTestBills} />);

    // Mock URL.createObjectURL and URL.revokeObjectURL
    const mockCreateObjectURL = vi.fn().mockReturnValue('blob:mock-url');
    const mockRevokeObjectURL = vi.fn();
    window.URL.createObjectURL = mockCreateObjectURL;
    window.URL.revokeObjectURL = mockRevokeObjectURL;

    // Click GST tab
    const gstTabBtn = screen.getByRole('button', { name: /Tax \(GST\)/i });
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

  it('navigates to Settled Invoices & Sales Register, tests timeline filtering, reprint button, and omni-search', () => {
    render(<ReportsDashboard bills={sampleTestBills} />);

    // Click Sales Register tab
    const salesTabBtn = screen.getByRole('button', { name: /Sales Register/i });
    fireEvent.click(salesTabBtn);

    expect(screen.getAllByText(/Sales Register/i).length).toBeGreaterThanOrEqual(1);
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
    expect(screen.getByText(/POB-TEST-001/i)).toBeInTheDocument();

    // Test Search input
    const searchInput = screen.getByPlaceholderText(/Search invoice #/i);
    fireEvent.change(searchInput, { target: { value: 'Ananya' } });
    expect(screen.getByText(/Ananya Sharma/i)).toBeInTheDocument();

    // Verify Reprint invoice button exists
    expect(screen.getByRole('button', { name: /Reprint/i })).toBeInTheDocument();
  });
});
