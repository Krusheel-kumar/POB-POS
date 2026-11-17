import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AddProductModal } from './AddProductModal';
import type { ProductCategory, AddOn } from '../types/pos';

const mockCategories: ProductCategory[] = [
  { id: 'cat-1', name: '🧋 Boba Teas', subcategories: ['Milk Teas', 'Fruit Teas'] },
];

const mockAddOns: AddOn[] = [
  { id: 'add-1', name: 'Regular (300ml)', price: 0, isActive: true, category: 'Choice Of Size', selectionType: 'SINGLE' },
  { id: 'add-2', name: 'Large (500ml)', price: 50, isActive: true, category: 'Choice Of Size', selectionType: 'SINGLE' },
  { id: 'add-3', name: 'Mango Popping Boba', price: 40, isActive: true, category: 'Choice Of Boba & Toppings', selectionType: 'MULTI' },
];

describe('AddProductModal Component (Minimal Production UI)', () => {
  it('renders clean navigation tabs and primary fields', () => {
    render(
      <AddProductModal
        isOpen={true}
        onClose={vi.fn()}
        categories={mockCategories}
        addOns={mockAddOns}
        onProductCreated={vi.fn()}
        onCategoryCreated={vi.fn()}
        onCreateAddOn={vi.fn()}
      />
    );

    expect(screen.getByText('+ Add Menu Item')).toBeInTheDocument();
    expect(screen.getByText(/Categories \(1\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Modifiers & Sizes \(3\)/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/e\.g\. Authentic Brown Sugar Boba Tea/i)).toBeInTheDocument();
  });

  it('supports creating a new category with comma-separated subcategories', async () => {
    const handleCategoryCreated = vi.fn().mockResolvedValue({
      id: 'cat-new',
      name: '🍕 Artisan Pizzas',
      subcategories: ['Wood Fired', 'Calzones'],
    });

    render(
      <AddProductModal
        isOpen={true}
        onClose={vi.fn()}
        categories={mockCategories}
        addOns={mockAddOns}
        onProductCreated={vi.fn()}
        onCategoryCreated={handleCategoryCreated}
        initialTab="category"
      />
    );

    const nameInput = screen.getByPlaceholderText(/e\.g\. 🧋 Boba Teas, 🍔 Burgers/i);
    fireEvent.change(nameInput, { target: { value: '🍕 Artisan Pizzas' } });

    const subcatsInput = screen.getByPlaceholderText(/e\.g\. Milk Teas, Fruit Teas/i);
    fireEvent.change(subcatsInput, { target: { value: 'Wood Fired, Calzones' } });

    const saveBtn = screen.getByRole('button', { name: /\+ Save Category/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(handleCategoryCreated).toHaveBeenCalledWith(
        expect.objectContaining({
          name: '🍕 Artisan Pizzas',
          subcategories: ['Wood Fired', 'Calzones'],
        })
      );
    });
  });

  it('supports adding a modifier option under Modifiers & Sizes tab', async () => {
    const handleCreateAddOn = vi.fn().mockResolvedValue({
      id: 'addon-new',
      name: 'Jumbo (700ml)',
      price: 70,
      category: 'Choice Of Size',
      selectionType: 'SINGLE',
      isActive: true,
    });

    render(
      <AddProductModal
        isOpen={true}
        onClose={vi.fn()}
        categories={mockCategories}
        addOns={mockAddOns}
        onProductCreated={vi.fn()}
        onCategoryCreated={vi.fn()}
        onCreateAddOn={handleCreateAddOn}
        initialTab="addons"
      />
    );

    const nameInput = screen.getByPlaceholderText(/e\.g\. Regular \(300ml\), Boba Pearls/i);
    fireEvent.change(nameInput, { target: { value: 'Jumbo (700ml)' } });

    const priceInput = screen.getByPlaceholderText('0');
    fireEvent.change(priceInput, { target: { value: '70' } });

    const addBtn = screen.getByRole('button', { name: /\+ Add Option/i });
    fireEvent.click(addBtn);

    await waitFor(() => {
      expect(handleCreateAddOn).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Jumbo (700ml)',
          price: 70,
          category: 'Choice Of Size',
          selectionType: 'SINGLE',
        })
      );
    });
  });

  it('submits a product with selected category, subcategory and mapped modifiers', async () => {
    const handleProductCreated = vi.fn().mockResolvedValue(undefined);

    render(
      <AddProductModal
        isOpen={true}
        onClose={vi.fn()}
        categories={mockCategories}
        addOns={mockAddOns}
        onProductCreated={handleProductCreated}
        onCategoryCreated={vi.fn()}
        initialTab="product"
      />
    );

    const prodNameInput = screen.getByPlaceholderText(/e\.g\. Authentic Brown Sugar Boba Tea/i);
    fireEvent.change(prodNameInput, { target: { value: 'Signature Taro Milk Tea' } });

    const priceInput = screen.getByPlaceholderText('240');
    fireEvent.change(priceInput, { target: { value: '250' } });

    const submitBtn = screen.getByRole('button', { name: /Save & Add to POS/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(handleProductCreated).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Signature Taro Milk Tea',
          basePrice: 250,
          categoryId: 'cat-1',
          subcategory: 'Milk Teas',
          dietaryType: 'BEVERAGE',
        })
      );
    });
  });
});
