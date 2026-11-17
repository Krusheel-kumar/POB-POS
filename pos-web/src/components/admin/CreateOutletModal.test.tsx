import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreateOutletModal } from './CreateOutletModal';
import { posApiClient } from '../../api/posApiClient';
import { useInventoryStore } from '../../store/useInventoryStore';

describe('CreateOutletModal Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders modal with required fields and defaults', () => {
    render(<CreateOutletModal isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByText('Add New Outlet Branch')).toBeInTheDocument();
    expect(screen.getByLabelText(/Outlet \/ Branch Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Branch Code/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Physical Address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Store Manager Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Branch Contact Phone/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Default POS Billing Policy/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Initial Commissary Allocation/i)).toBeInTheDocument();
  });

  it('submits new outlet creation and synchronizes with inventory store', async () => {
    const handleCreated = vi.fn();
    const createOutletSpy = vi.spyOn(posApiClient, 'createOutlet').mockResolvedValue({
      id: 'outlet-new-test',
      name: "POP O' BOB - Gachibowli Financial District",
      code: 'POB-FD-04',
      address: 'WaveRock SEZ, Gachibowli',
      phone: '+91 98765 11223',
      managerName: 'Kiran Kumar',
      paymentPolicy: 'FLEXIBLE',
    });

    render(
      <CreateOutletModal
        isOpen={true}
        onClose={vi.fn()}
        onOutletCreated={handleCreated}
      />
    );

    fireEvent.change(screen.getByLabelText(/Outlet \/ Branch Name/i), {
      target: { value: "POP O' BOB - Gachibowli Financial District" },
    });
    fireEvent.change(screen.getByLabelText(/Branch Code/i), {
      target: { value: 'POB-FD-04' },
    });
    fireEvent.change(screen.getByLabelText(/Physical Address/i), {
      target: { value: 'WaveRock SEZ, Gachibowli' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Create Outlet Branch/i }));

    await waitFor(() => {
      expect(createOutletSpy).toHaveBeenCalledTimes(1);
      expect(handleCreated).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'outlet-new-test',
          name: "POP O' BOB - Gachibowli Financial District",
        })
      );
    });

    // Check that outlet was registered in useInventoryStore
    const invOutlets = useInventoryStore.getState().outlets;
    expect(invOutlets.some((o) => o.id === 'outlet-new-test')).toBe(true);
  });
});
