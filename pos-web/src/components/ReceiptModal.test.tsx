import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import {
  ReceiptModal,
  extractItemToppings,
  extractItemCleanVariant,
  calculateItemBreakdown,
} from './ReceiptModal';

describe('ReceiptModal - Compact Thermal Printing Design & Transparent Pricing', () => {
  const sampleOrder = {
    id: 'ord-1001',
    orderNumber: 'ORD-1001',
    orderType: 'DINE_IN',
    status: 'ACTIVE',
    customerName: 'Anil Kumar',
    customerPhone: '9876543210',
    subtotal: 309,
    taxableAmount: 309,
    taxAmount: 15.46,
    totalAmount: 324,
    table: { tableNumber: 'T1' },
    createdAt: '2026-11-21T10:30:00.000Z',
    items: [
      {
        id: 'item-1',
        productNameSnapshot: 'Authentic Brown Sugar Milk Tea',
        variantNameSnapshot: 'Regular',
        quantity: 1,
        unitPriceSnapshot: 309,
        lineTotalSnapshot: 309,
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
    subtotal: 309,
    taxableAmount: 309,
    cgstAmount: 7.73,
    sgstAmount: 7.73,
    taxAmount: 15.46,
    totalAmount: 324,
    paidAmount: 324,
    order: sampleOrder,
    payments: [{ paymentMethod: 'UPI', amount: 324 }],
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

  it('calculates genuine base price and separates extra charges for toppings and sizes', () => {
    // Case 1: Authentic 309 (base 249 + topping 60)
    const item1 = {
      productNameSnapshot: 'Authentic Brown Sugar Milk Tea',
      quantity: 1,
      unitPriceSnapshot: 309,
      lineTotalSnapshot: 309,
      addOns: [{ name: 'Tapioca Pearls', price: 60 }],
    };
    const bd1 = calculateItemBreakdown(item1);
    expect(bd1.baseRate).toBe(249);
    expect(bd1.baseAmount).toBe(249);
    expect(bd1.toppings[0].amount).toBe(60);
    expect(bd1.baseAmount + bd1.toppings[0].amount).toBe(309);

    // Case 2: Authentic with Large (+69) and topping (+60) = 378
    const item2 = {
      productNameSnapshot: 'Authentic Brown Sugar Milk Tea',
      quantity: 1,
      unitPriceSnapshot: 378,
      lineTotalSnapshot: 378,
      variantNameSnapshot: 'Large (+₹69)',
      addOns: [{ name: 'Tapioca Pearls', price: 60 }],
    };
    const bd2 = calculateItemBreakdown(item2);
    expect(bd2.baseRate).toBe(249);
    expect(bd2.sizeAmount).toBe(69);
    expect(bd2.toppings[0].amount).toBe(60);
    expect(bd2.baseAmount + bd2.sizeAmount + bd2.toppings[0].amount).toBe(378);
  });

  it('renders Customer Bill showing real base item price (249), transparent modifiers, and compliant 5% GST', () => {
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

    // Real Item Base Price (₹249.00) in rate and amount columns
    const baseAmounts = screen.getAllByText('₹249.00');
    expect(baseAmounts.length).toBeGreaterThanOrEqual(1);

    // Transparent Toppings Pricing
    expect(screen.getByText('+ Fresh Milk')).toBeInTheDocument();
    expect(screen.getAllByText('₹0').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('+ Tapioca Pearls')).toBeInTheDocument();
    expect(screen.getByText('+₹60.00')).toBeInTheDocument();

    // GST Compliance: 2.5% CGST + 2.5% SGST on composite subtotal ₹309.00
    expect(screen.getByText('₹309.00')).toBeInTheDocument();
    const gstAmounts = screen.getAllByText('₹7.73');
    expect(gstAmounts).toHaveLength(2); // CGST and SGST
    expect(screen.getAllByText('₹324.00').length).toBeGreaterThanOrEqual(1);
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
    expect(screen.getByText('Authentic Brown Sugar Milk Tea')).toBeInTheDocument();
    expect(screen.getByText('+ Fresh Milk')).toBeInTheDocument();
    expect(screen.getByText('+ Tapioca Pearls')).toBeInTheDocument();
  });
});
