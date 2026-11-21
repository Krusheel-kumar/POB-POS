import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ProductModal from './ProductModal';
import type { Product, AddOn, CartItem } from '../types/pos';

const mockAddOns: AddOn[] = [
  // Single choice group: Size
  {
    id: 'size-reg',
    name: 'Regular (350ml)',
    price: 0,
    isActive: true,
    category: 'Choice Of Size',
    selectionType: 'SINGLE',
    minSelections: 1,
    maxSelections: 1,
  },
  {
    id: 'size-large',
    name: 'Large (500ml)',
    price: 40,
    isActive: true,
    category: 'Choice Of Size',
    selectionType: 'SINGLE',
    minSelections: 1,
    maxSelections: 1,
  },
  // Multi choice group: Toppings (Max 2)
  {
    id: 'top-boba',
    name: 'Brown Sugar Pearls',
    price: 35,
    isActive: true,
    category: 'Choice Of Boba & Toppings',
    selectionType: 'MULTI',
    minSelections: 0,
    maxSelections: 2,
  },
  {
    id: 'top-jelly',
    name: 'Grass Jelly',
    price: 30,
    isActive: true,
    category: 'Choice Of Boba & Toppings',
    selectionType: 'MULTI',
    minSelections: 0,
    maxSelections: 2,
  },
  {
    id: 'top-pudding',
    name: 'Egg Pudding',
    price: 40,
    isActive: true,
    category: 'Choice Of Boba & Toppings',
    selectionType: 'MULTI',
    minSelections: 0,
    maxSelections: 2,
  },
];

const mockProduct: Product = {
  id: 'prod-1',
  name: 'Authentic Milk Tea',
  description: 'Signature Taiwanese black tea blend with fresh milk',
  basePrice: 220,
  isActive: true,
  category: { id: 'cat-1', name: 'Milk Teas', subcategories: [] },
  variants: [],
  addOns: mockAddOns,
};

describe('ProductModal Component', () => {
  it('renders modal with product details and auto-selects default single choice', () => {
    const handleAdd = vi.fn();
    const handleClose = vi.fn();

    render(
      <ProductModal
        product={mockProduct}
        isOpen={true}
        onAddToCart={handleAdd}
        onClose={handleClose}
      />
    );

    expect(screen.getByText('Authentic Milk Tea')).toBeInTheDocument();
    expect(screen.getByText('Regular (350ml)')).toBeInTheDocument();
    expect(screen.getByText('Brown Sugar Pearls')).toBeInTheDocument();

    // Default regular size (0) selected -> price is base price ₹220.00
    expect(screen.getByRole('button', { name: /Add to Cart/i })).toBeInTheDocument();
    expect(screen.getByText('₹220.00')).toBeInTheDocument();
  });

  it('enforces min and max selections for multi-choice toppings', () => {
    const handleAdd = vi.fn();
    const handleClose = vi.fn();

    render(
      <ProductModal
        product={mockProduct}
        isOpen={true}
        onAddToCart={handleAdd}
        onClose={handleClose}
      />
    );

    // Initial badge shows Max 2
    expect(screen.getByText(/Max 2/i)).toBeInTheDocument();

    // Select 1st topping: Brown Sugar Pearls (+35)
    fireEvent.click(screen.getByText('Brown Sugar Pearls'));
    expect(screen.getByText(/1\/2 selected/i)).toBeInTheDocument();
    expect(screen.getByText('₹255.00')).toBeInTheDocument();

    // Select 2nd topping: Grass Jelly (+30) -> 220 + 35 + 30 = 285.00
    fireEvent.click(screen.getByText('Grass Jelly'));
    // Max reached indicator (2/2 selected) and unselected item becomes disabled
    expect(screen.getByText(/2\/2 selected/i)).toBeInTheDocument();
    expect(screen.getByText('₹285.00')).toBeInTheDocument();
    expect(screen.getByText('Egg Pudding').closest('button')).toBeDisabled();

    // Attempt to click 3rd topping: Egg Pudding -> disabled, so clicking does not increase price
    fireEvent.click(screen.getByText('Egg Pudding'));
    expect(screen.getByText('₹285.00')).toBeInTheDocument();

    // Deselect Grass Jelly -> count goes back to 1/2 and Egg Pudding is re-enabled
    fireEvent.click(screen.getByText('Grass Jelly'));
    expect(screen.getByText(/1\/2 selected/i)).toBeInTheDocument();
    expect(screen.getByText('₹255.00')).toBeInTheDocument();
    expect(screen.getByText('Egg Pudding').closest('button')).not.toBeDisabled();

    // Now Egg Pudding can be selected (+40) -> 220 + 35 + 40 = 295.00
    fireEvent.click(screen.getByText('Egg Pudding'));
    expect(screen.getByText(/2\/2 selected/i)).toBeInTheDocument();
    expect(screen.getByText('₹295.00')).toBeInTheDocument();

    // Submit add to cart
    fireEvent.click(screen.getByRole('button', { name: /Add to Cart/i }));
    expect(handleAdd).toHaveBeenCalledTimes(1);
    expect(handleAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        product: expect.objectContaining({ name: 'Authentic Milk Tea' }),
        quantity: 1,
        selectedAddOns: expect.arrayContaining([
          expect.objectContaining({ id: 'size-reg' }),
          expect.objectContaining({ id: 'top-boba' }),
          expect.objectContaining({ id: 'top-pudding' }),
        ]),
      })
    );
  });

  it('pre-populates existing cart item toppings and calls onUpdateCartItem when updating', () => {
    const handleAdd = vi.fn();
    const handleUpdate = vi.fn();
    const handleClose = vi.fn();

    const mockCartItem: CartItem = {
      id: 'cart-item-123',
      product: mockProduct,
      quantity: 2,
      unitPrice: 255, // 220 base + 35 boba
      lineTotal: 510,
      selectedAddOns: [mockAddOns[0], mockAddOns[2]], // size-reg and top-boba
      itemNotes: 'Less Ice',
    };

    render(
      <ProductModal
        product={mockProduct}
        isOpen={true}
        onAddToCart={handleAdd}
        onClose={handleClose}
        editingCartItem={mockCartItem}
        onUpdateCartItem={handleUpdate}
      />
    );

    // Shows editing badge and Update Item button with current total: 255 * 2 = 510
    expect(screen.getByText(/Editing Item Toppings/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Update Item/i })).toBeInTheDocument();
    expect(screen.getByText('₹510.00')).toBeInTheDocument();
    expect(screen.getByText(/1\/2 selected/i)).toBeInTheDocument();

    // Change topping: add Grass Jelly (+30) -> (220 + 35 + 30) * 2 = 570.00
    fireEvent.click(screen.getByText('Grass Jelly'));
    expect(screen.getByText('₹570.00')).toBeInTheDocument();

    // Click Update Item button
    fireEvent.click(screen.getByRole('button', { name: /Update Item/i }));

    expect(handleUpdate).toHaveBeenCalledTimes(1);
    expect(handleUpdate).toHaveBeenCalledWith(
      'cart-item-123',
      expect.objectContaining({
        product: expect.objectContaining({ name: 'Authentic Milk Tea' }),
        quantity: 2,
        unitPrice: 285,
        selectedAddOns: expect.arrayContaining([
          expect.objectContaining({ id: 'size-reg' }),
          expect.objectContaining({ id: 'top-boba' }),
          expect.objectContaining({ id: 'top-jelly' }),
        ]),
      })
    );
    expect(handleAdd).not.toHaveBeenCalled();
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
