import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import store from '../../store/store';
import PharmacyReservations from './Reservations';
import pharmacyOwnerService from '../../services/pharmacyOwnerService';
import useAuth from '../../hooks/useAuth';

vi.mock('../../services/pharmacyOwnerService');
vi.mock('../../hooks/useAuth');

describe('PharmacyReservations Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: 2, fullName: 'MedPlus Owner', role: 'PHARMACY_OWNER' },
    });
  });

  it('renders reservation cards and action buttons for pending holds', async () => {
    pharmacyOwnerService.getReservations.mockResolvedValue([
      {
        id: 500,
        reservationCode: 'MFA-HOLD99',
        customerName: 'Aarav Sharma',
        customerPhone: '+91 9876543210',
        medicineName: 'Azithromycin 500mg',
        genericName: 'Azithromycin',
        strength: '500mg',
        dosageForm: 'Tablet',
        requiresPrescription: true,
        quantity: 2,
        unitPrice: 120.0,
        totalPrice: 240.0,
        status: 'PENDING',
        createdAt: '2026-08-31T10:00:00Z',
      },
    ]);

    render(
      <Provider store={store}>
        <BrowserRouter>
          <PharmacyReservations />
        </BrowserRouter>
      </Provider>
    );

    expect(screen.getByText(/Customer Reservation Queue/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('MFA-HOLD99')).toBeInTheDocument();
      expect(screen.getByText('Azithromycin 500mg')).toBeInTheDocument();
      expect(screen.getByText('Aarav Sharma')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Confirm Hold/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Reject/i })).toBeInTheDocument();
    });
  });
});
