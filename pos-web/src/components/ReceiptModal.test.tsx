import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ReceiptModal, extractItemToppings, extractItemCleanVariant } from './ReceiptModal';

describe('ReceiptModal - Compact Thermal Printing Design', () => {
  const sampleOrder = {
    id: 'ord-1001',
    orderNumber: 'ORD-1001',
    orderType: 'DINE_IN',
    status: 'ACTIVE',
    customerName: 'Anil Kumar',
    customerPhone: '9876543210',
    subtotal: 299,
    taxAmount: 14.96,
    totalAmount: 314,
    table: { tableNumber: 'T1' },
    createdAt: '2026-11-21T10:30:00.000Z',
    items: [
      {
        id: 'item-1',
        productNameSnapshot: 'Mango Pulp Milk Tea',
        variantNameSnapshot: 'Regular',
        quantity: 1,
        unitPriceSnapshot: 299,
        lineTotalSnapshot: 299,
        addOns: [
          { name: 'Fresh Milk', price: 0 },
          { name: 'Tapioca Pearls', price: 60 },
        ],
      },
    ],
  };

  const sampleBill = {
    id: 'bill-1001',
    invoiceNumber: 'POB-FLG-1001',
    status: 'PAID',
    customerName: 'Anil Kumar',
    customerPhone: '9876543210',
    subtotal: 299,
    taxAmount: 14.96,
    totalAmount: 314,
    paidAmount: 314,
    order: sampleOrder,
    payments: [{ paymentMethod: 'UPI', amount: 314 }],
    createdAt: '2026-11-21T10:30:00.000Z',
  };

  it('extracts toppings and prices accurately with free and charged items', () => {
    const item = {
      addOns: [
        { name: 'Fresh Milk', price: 0 },
        { name: 'Tapioca Pearls', price: 60 },
      ],
    };
    const toppings = extractItemToppings(item);
    expect(toppings).toHaveLength(2);
    expect(toppings[0]).toEqual({ name: 'Fresh Milk', price: 0 });
    expect(toppings[1]).toEqual({ name: 'Tapioca Pearls', price: 60 });
  });

  it('extracts clean variant without modifier string pollution', () => {
    expect(extractItemCleanVariant({ variantNameSnapshot: 'Large • +Tapioca Pearls' })).toBe('Large');
    expect(extractItemCleanVariant({ variantNameSnapshot: '+Tapioca Pearls' })).toBeNull();
    expect(extractItemCleanVariant({ variantNameSnapshot: 'Regular' })).toBe('Regular');
  });

  it('renders Customer Bill without ORIGINAL FOR RECIPIENT or TAX INVOICE title and has 2x2 grid', () => {
    render(
      <ReceiptModal
        isOpen={true}
        onClose={vi.fn()}
        mode="BILL"
        order={sampleOrder}
        bill={sampleBill as any}
      />
    );

    // Header validations
    expect(screen.getByRole('heading', { name: /POP O' BOB/i })).toBeInTheDocument();
    expect(screen.queryByText(/ORIGINAL FOR RECIPIENT/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/TAX INVOICE \/ CASH BILL/i)).not.toBeInTheDocument();

    // 2x2 Grid Customer & Order metadata
    expect(screen.getByText('Anil Kumar')).toBeInTheDocument();
    expect(screen.getByText('+91 9876543210')).toBeInTheDocument();
    expect(screen.getByText('POB-FLG-1001')).toBeInTheDocument();
    expect(screen.getByText('DINE IN')).toBeInTheDocument();
    expect(screen.getByText('Table T1')).toBeInTheDocument();

    // Transparent Toppings Pricing
    expect(screen.getByText('+ Fresh Milk')).toBeInTheDocument();
    expect(screen.getByText('₹0')).toBeInTheDocument();
    expect(screen.getByText('+ Tapioca Pearls')).toBeInTheDocument();
    expect(screen.getByText('₹60.00')).toBeInTheDocument();
  });

  it('renders KOT in minimal paper-saving layout with serial KOT number and 2 single-line meta', () => {
    render(
      <ReceiptModal
        isOpen={true}
        onClose={vi.fn()}
        mode="KOT"
        order={sampleOrder}
      />
    );

    // Minimal KOT Header
    expect(screen.getByText(/KOT - #001/i)).toBeInTheDocument();
    expect(screen.getByText('DATE:')).toBeInTheDocument();
    expect(screen.getByText('TIME:')).toBeInTheDocument();
    expect(screen.getByText('ORDER:')).toBeInTheDocument();
    expect(screen.getByText('TYPE:')).toBeInTheDocument();

    // Items and toppings
    expect(screen.getByText('Mango Pulp Milk Tea')).toBeInTheDocument();
    expect(screen.getByText('+ Fresh Milk')).toBeInTheDocument();
    expect(screen.getByText('+ Tapioca Pearls')).toBeInTheDocument();
  });
});
