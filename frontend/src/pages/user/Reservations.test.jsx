import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import store from '../../store/store';
import Reservations from './Reservations';
import reservationService from '../../services/reservationService';

vi.mock('../../services/reservationService');

describe('Reservations Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders reservations header banner and stat chips', async () => {
    reservationService.getMyReservations.mockResolvedValueOnce([]);

    render(
      <Provider store={store}>
        <BrowserRouter>
          <Reservations />
        </BrowserRouter>
      </Provider>
    );

    expect(screen.getByText(/My Medicine Reservations/i)).toBeInTheDocument();
    expect(screen.getByText(/Reserve New Medicine/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/No Reservations Found/i)).toBeInTheDocument();
    });
  });

  it('displays user reservations with hold code and status badges', async () => {
    const mockReservations = [
      {
        id: 101,
        reservationCode: 'MFA-8K4P2Q',
        medicineId: 10,
        medicineName: 'Amoxicillin 500mg',
        genericName: 'Amoxicillin',
        strength: '500mg',
        dosageForm: 'Capsule',
        requiresPrescription: true,
        pharmacyId: 20,
        pharmacyName: 'Apollo Care Pharmacy',
        pharmacyAddress: '123 Main Road',
        pharmacyCity: 'Hyderabad',
        quantity: 2,
        unitPrice: 45.0,
        totalPrice: 90.0,
        status: 'PENDING',
        createdAt: '2026-08-31T10:00:00',
        expiresAt: '2026-09-01T10:00:00',
      },
    ];

    reservationService.getMyReservations.mockResolvedValueOnce(mockReservations);

    render(
      <Provider store={store}>
        <BrowserRouter>
          <Reservations />
        </BrowserRouter>
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText('MFA-8K4P2Q')).toBeInTheDocument();
      expect(screen.getByText('Amoxicillin 500mg')).toBeInTheDocument();
      expect(screen.getByText('Apollo Care Pharmacy')).toBeInTheDocument();
      expect(screen.getByText(/Pending 24h Hold/i)).toBeInTheDocument();
      expect(screen.getByText(/Rx Required at Pickup/i)).toBeInTheDocument();
      expect(screen.getByText(/Cancel Hold/i)).toBeInTheDocument();
    });
  });
});
