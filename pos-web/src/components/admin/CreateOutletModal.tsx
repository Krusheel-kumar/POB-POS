import React, { useState } from 'react';
import { Store, MapPin, Phone, User, ShieldCheck, Package, X } from 'lucide-react';
import type { Outlet, PaymentPolicy, CreateOutletRequest } from '../../types/pos';
import { posApiClient } from '../../api/posApiClient';
import { useInventoryStore } from '../../store/useInventoryStore';
import './CreateOutletModal.css';

interface CreateOutletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOutletCreated?: (newOutlet: Outlet) => void;
}

export const CreateOutletModal: React.FC<CreateOutletModalProps> = ({
  isOpen,
  onClose,
  onOutletCreated,
}) => {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [managerName, setManagerName] = useState('');
  const [paymentPolicy, setPaymentPolicy] = useState<PaymentPolicy>('FLEXIBLE');
  const [initialStock, setInitialStock] = useState<'EMPTY' | 'STARTER_PACK'>('STARTER_PACK');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide a valid branch/outlet name');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const payload: CreateOutletRequest = {
        name: name.trim(),
        code: code.trim() || undefined,
        address: address.trim() || undefined,
        phone: phone.trim() || undefined,
        managerName: managerName.trim() || undefined,
        paymentPolicy,
      };

      // 1. Create in POS Mock Store / Backend
      const createdOutlet = await posApiClient.createOutlet(payload);

      // 2. Synchronize with Central Master Inventory Store
      useInventoryStore.getState().createOutlet({
        id: createdOutlet.id,
        name: createdOutlet.name,
        code: createdOutlet.code,
        address: createdOutlet.address,
        phone: createdOutlet.phone,
        managerName: createdOutlet.managerName,
        initialStockAllocation: initialStock,
      });

      // 3. Callback and close
      if (onOutletCreated) {
        onOutletCreated(createdOutlet);
      }
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create new outlet branch');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="outlet-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="outlet-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="outlet-modal-header">
          <div className="outlet-modal-title">
            <div className="outlet-modal-icon-badge">
              <Store size={22} color="#0284c7" />
            </div>
            <div>
              <h3>Add New Outlet Branch</h3>
              <p>Onboard a new location to POP O' BOB Multi-Outlet Network</p>
            </div>
          </div>
          <button
            type="button"
            className="outlet-modal-close-btn"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="outlet-modal-form">
          {error && <div className="outlet-modal-error">{error}</div>}

          <div className="outlet-form-row">
            <div className="outlet-form-group flex-2">
              <label htmlFor="outlet-name">
                Outlet / Branch Name <span className="req">*</span>
              </label>
              <div className="input-with-icon">
                <Store size={16} className="field-icon" />
                <input
                  id="outlet-name"
                  type="text"
                  required
                  placeholder="e.g. POP O' BOB - Gachibowli Financial District"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>

            <div className="outlet-form-group flex-1">
              <label htmlFor="outlet-code">Branch Code</label>
              <input
                id="outlet-code"
                type="text"
                placeholder="e.g. POB-FD-04"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
              />
            </div>
          </div>

          <div className="outlet-form-group">
            <label htmlFor="outlet-address">Physical Address</label>
            <div className="input-with-icon">
              <MapPin size={16} className="field-icon" />
              <input
                id="outlet-address"
                type="text"
                placeholder="e.g. Shop 14, Ground Floor, WaveRock SEZ, Nanakramguda, Hyderabad"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
          </div>

          <div className="outlet-form-row">
            <div className="outlet-form-group flex-1">
              <label htmlFor="outlet-manager">Store Manager Name</label>
              <div className="input-with-icon">
                <User size={16} className="field-icon" />
                <input
                  id="outlet-manager"
                  type="text"
                  placeholder="e.g. Kiran Kumar"
                  value={managerName}
                  onChange={(e) => setManagerName(e.target.value)}
                />
              </div>
            </div>

            <div className="outlet-form-group flex-1">
              <label htmlFor="outlet-phone">Branch Contact Phone</label>
              <div className="input-with-icon">
                <Phone size={16} className="field-icon" />
                <input
                  id="outlet-phone"
                  type="tel"
                  placeholder="e.g. +91 98765 11223"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="outlet-form-row">
            <div className="outlet-form-group flex-1">
              <label htmlFor="outlet-policy">Default POS Billing Policy</label>
              <div className="input-with-icon">
                <ShieldCheck size={16} className="field-icon" />
                <select
                  id="outlet-policy"
                  value={paymentPolicy}
                  onChange={(e) => setPaymentPolicy(e.target.value as PaymentPolicy)}
                >
                  <option value="FLEXIBLE">Flexible (Dine-in / QSR hybrid)</option>
                  <option value="PAY_FIRST">Pay First (QSR counter kiosk)</option>
                  <option value="PAY_LATER">Pay Later (Fine dine & table service)</option>
                </select>
              </div>
            </div>

            <div className="outlet-form-group flex-1">
              <label htmlFor="outlet-stock">Initial Commissary Allocation</label>
              <div className="input-with-icon">
                <Package size={16} className="field-icon" />
                <select
                  id="outlet-stock"
                  value={initialStock}
                  onChange={(e) => setInitialStock(e.target.value as 'EMPTY' | 'STARTER_PACK')}
                >
                  <option value="STARTER_PACK">📦 Starter Pack (50% Reorder Buffer)</option>
                  <option value="EMPTY">⚪ Zero Stock (Indent via Master Commissary)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="outlet-info-callout">
            <Package size={18} color="#0284c7" />
            <span>
              Creating this outlet automatically configures local stock tracking, registers it in the
              Central Commissary pipeline, and enables live POS counter billing.
            </span>
          </div>

          <div className="outlet-modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
              style={{ background: '#0284c7', borderColor: '#0284c7' }}
            >
              {isSubmitting ? 'Creating Branch...' : '✨ Create Outlet Branch'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
