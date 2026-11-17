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

describe('AddProductModal Component (Operation Flow 1 Wizard)', () => {
  it('renders wizard tabs with step numbers and counts', () => {
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

    expect(screen.getByText(/Live Menu & Catalog Wizard/i)).toBeInTheDocument();
    expect(screen.getByText(/Category & Subcategories/i)).toBeInTheDocument();
    expect(screen.getByText(/Topping Groups & Choices/i)).toBeInTheDocument();
    expect(screen.getByText(/Add Item & Map Toppings/i)).toBeInTheDocument();
  });

  it('switches to Step 1 and supports adding subcategory tags', async () => {
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

    // Switch to category tab
    const catTab = screen.getByRole('button', { name: /Category & Subcategories/i });
    fireEvent.click(catTab);

    expect(screen.getByText(/Step 1: Set Up Your Menu Categories/i)).toBeInTheDocument();

    const nameInput = screen.getByPlaceholderText(/e\.g\. 🧋 Boba Teas/i);
    fireEvent.change(nameInput, { target: { value: '🍕 Artisan Pizzas' } });

    // Add subcategory tag
    const subcatInput = screen.getByPlaceholderText(/Add subcategory tag/i);
    fireEvent.change(subcatInput, { target: { value: 'Wood Fired' } });
    const addTagBtn = screen.getByRole('button', { name: /\+ Add Tag/i });
    fireEvent.click(addTagBtn);

    expect(screen.getByText('Wood Fired')).toBeInTheDocument();

    const saveBtn = screen.getByRole('button', { name: /Save Category/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(handleCategoryCreated).toHaveBeenCalledWith(
        expect.objectContaining({
          name: '🍕 Artisan Pizzas',
        })
      );
    });
  });

  it('switches to Step 2 and adds a choice into Choice Of Size group', async () => {
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

    expect(screen.getByText(/Step 2: Create Topping Groups/i)).toBeInTheDocument();

    const choiceInput = screen.getByPlaceholderText(/e\.g\. Regular \(300ml\)/i);
    fireEvent.change(choiceInput, { target: { value: 'Jumbo (700ml)' } });

    const priceInput = screen.getByPlaceholderText('0');
    fireEvent.change(priceInput, { target: { value: '70' } });

    const addChoiceBtn = screen.getByRole('button', { name: /Add Choice to Group/i });
    fireEvent.click(addChoiceBtn);

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

  it('submits a product with mapped topping groups in Step 3', async () => {
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
    fireEvent.change(prodNameInput, { target: { value: 'Authentic Brown Sugar Boba' } });

    const priceInput = screen.getByPlaceholderText('240');
    fireEvent.change(priceInput, { target: { value: '260' } });

    // Submit button
    const submitBtn = screen.getByRole('button', { name: /Create Item & Add to Live POS Menu/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(handleProductCreated).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Authentic Brown Sugar Boba',
          basePrice: 260,
          categoryId: 'cat-1',
          dietaryType: 'BEVERAGE',
        })
      );
    });
  });
});
