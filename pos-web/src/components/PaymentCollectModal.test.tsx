import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PaymentCollectModal from './PaymentCollectModal';
import type { Order, Bill } from '../types/pos';

const mockOrder: Order = {
  id: 'order-123',
  orderNumber: 'ORD-2026-0032',
  orderType: 'DINE_IN',
  table: { id: 'tbl-1', tableNumber: 'T1', capacity: 4, status: 'RUNNING' },
  status: 'PENDING',
  totalAmount: 282.0,
  taxAmount: 13.46,
  discountAmount: 0,
  subtotal: 269.0,
  taxableAmount: 269.0,
  createdAt: new Date().toISOString(),
  items: [
    {
      id: 'item-1',
      productId: 'prod-1',
      productNameSnapshot: 'Choco Fantasy Milk Tea',
      quantity: 1,
      unitPriceSnapshot: 269.0,
      lineTotalSnapshot: 269.0,
    },
  ],
};

const mockBill: Bill = {
  id: 'bill-123',
  invoiceNumber: 'INV-2026-3332',
  orderId: 'order-123',
  subtotal: 269.0,
  discountAmount: 0,
  taxableAmount: 269.0,
  taxAmount: 13.46,
  totalAmount: 282.0,
  paidAmount: 0,
  status: 'ISSUED',
  createdAt: new Date().toISOString(),
};

describe('PaymentCollectModal Component', () => {
  it('renders settlement header, total balance due and 4 payment methods', () => {
    const handleRecordPayment = vi.fn().mockResolvedValue(undefined);
    const handleClose = vi.fn();

    render(
      <PaymentCollectModal
        isOpen={true}
        onClose={handleClose}
        order={mockOrder}
        bill={mockBill}
        onRecordPayment={handleRecordPayment}
        isProcessing={false}
      />
    );

    expect(screen.getByText(/Settle Bill & Collect Payment/i)).toBeInTheDocument();
    expect(screen.getByText(/Table T1/i)).toBeInTheDocument();
    expect(screen.getAllByText('₹282.00').length).toBeGreaterThan(0);
    expect(screen.getByText('Cash')).toBeInTheDocument();
    expect(screen.getByText('UPI / QR')).toBeInTheDocument();
    expect(screen.getByText('Card')).toBeInTheDocument();
    expect(screen.getByText('Split / Other')).toBeInTheDocument();
  });

  it('calculates change to return when cash tender is selected and submits payment', async () => {
    const handleRecordPayment = vi.fn().mockResolvedValue(undefined);
    const handleClose = vi.fn();

    render(
      <PaymentCollectModal
        isOpen={true}
        onClose={handleClose}
        order={mockOrder}
        bill={mockBill}
        onRecordPayment={handleRecordPayment}
        isProcessing={false}
      />
    );

    // Click quick cash tender pill for ₹500
    const pill500 = screen.getByRole('button', { name: /₹500/i });
    fireEvent.click(pill500);

    // Verify Change to Return calculation: 500 - 282 = 218
    expect(screen.getByText(/Change to Return/i)).toBeInTheDocument();
    expect(screen.getByText('₹218.00')).toBeInTheDocument();

    // Submit payment
    const confirmBtn = screen.getByRole('button', { name: /Settle Table & Print Receipt/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(handleRecordPayment).toHaveBeenCalledWith(
        282.0,
        'CASH',
        expect.stringContaining('Tendered: ₹500.00, Change: ₹218.00'),
        true
      );
    });
  });

  it('switches to UPI mode and displays store QR frame', () => {
    const handleRecordPayment = vi.fn().mockResolvedValue(undefined);
    const handleClose = vi.fn();

    render(
      <PaymentCollectModal
        isOpen={true}
        onClose={handleClose}
        order={mockOrder}
        bill={mockBill}
        onRecordPayment={handleRecordPayment}
        isProcessing={false}
      />
    );

    // Switch to UPI
    fireEvent.click(screen.getByText('UPI / QR'));

    expect(screen.getByText(/SCAN TO PAY/i)).toBeInTheDocument();
    expect(screen.getByText(/popobob@icici/i)).toBeInTheDocument();
    expect(screen.getByText(/Soundbox \/ Notification Verified/i)).toBeInTheDocument();
  });
});
