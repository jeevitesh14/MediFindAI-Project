import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import store from '../../store/store';
import PharmacyInventory from './Inventory';
import pharmacyOwnerService from '../../services/pharmacyOwnerService';
import useAuth from '../../hooks/useAuth';

vi.mock('../../services/pharmacyOwnerService');
vi.mock('../../hooks/useAuth');

describe('PharmacyInventory Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: 2, fullName: 'MedPlus Owner', role: 'PHARMACY_OWNER' },
    });
  });

  it('renders inventory management banner and table headers', async () => {
    pharmacyOwnerService.getInventory.mockResolvedValue([
      {
        id: 100,
        medicineName: 'Paracetamol 500mg',
        genericName: 'Paracetamol',
        strength: '500mg',
        dosageForm: 'Tablet',
        requiresPrescription: false,
        price: 25.0,
        quantity: 45,
        stockStatus: 'AVAILABLE',
        lowStockThreshold: 10,
      },
    ]);

    render(
      <Provider store={store}>
        <BrowserRouter>
          <PharmacyInventory />
        </BrowserRouter>
      </Provider>
    );

    expect(screen.getByText(/Medicine Inventory Management/i)).toBeInTheDocument();
    expect(screen.getByText(/Add Medicine to Inventory/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Paracetamol 500mg')).toBeInTheDocument();
      expect(screen.getByText('₹25.00')).toBeInTheDocument();
      expect(screen.getByText('45')).toBeInTheDocument();
    });
  });

  it('renders empty state when no medicines in inventory', async () => {
    pharmacyOwnerService.getInventory.mockResolvedValue([]);

    render(
      <Provider store={store}>
        <BrowserRouter>
          <PharmacyInventory />
        </BrowserRouter>
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText(/No inventory items matched your criteria/i)).toBeInTheDocument();
    });
  });

  it('renders Scan Barcode action button in header', async () => {
    pharmacyOwnerService.getInventory.mockResolvedValue([]);

    render(
      <Provider store={store}>
        <BrowserRouter>
          <PharmacyInventory />
        </BrowserRouter>
      </Provider>
    );

    expect(screen.getAllByText(/Scan Barcode/i)[0]).toBeInTheDocument();
  });
});

