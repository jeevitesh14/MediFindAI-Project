import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import store from '../../store/store';
import NearbyPharmacies from './NearbyPharmacies';
import pharmacyService from '../../services/pharmacyService';

vi.mock('../../services/pharmacyService');
vi.mock('../../components/PharmacyMap', () => ({
  default: () => <div data-testid="pharmacy-map">Nearby Pharmacy Map</div>,
}));

describe('NearbyPharmacies Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders header banner and "Use My Location" prompt', () => {
    render(
      <Provider store={store}>
        <BrowserRouter>
          <NearbyPharmacies />
        </BrowserRouter>
      </Provider>
    );

    expect(screen.getByText(/Find Nearby Pharmacies/i)).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /use my location/i }).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Hyderabad \(Central\)/i)).toBeInTheDocument();
  });

  it('fetches and displays nearby pharmacy cards when a preset location is selected', async () => {
    const mockPharmacies = [
      {
        id: 1,
        name: 'Apollo Care Pharmacy',
        description: 'Licensed 24x7 pharmacy',
        addressLine: 'Road No 36, Jubilee Hills',
        city: 'Hyderabad',
        postalCode: '500033',
        phone: '+91 9876543210',
        is24Hours: true,
        isOpenNow: true,
        rating: 4.8,
        latitude: 17.4300,
        longitude: 78.4050,
        distanceKm: 1.45,
      },
    ];

    pharmacyService.getNearbyPharmacies.mockResolvedValueOnce(mockPharmacies);

    render(
      <Provider store={store}>
        <BrowserRouter>
          <NearbyPharmacies />
        </BrowserRouter>
      </Provider>
    );

    const hyderabadBtn = screen.getByText(/Hyderabad \(Central\)/i);
    fireEvent.click(hyderabadBtn);

    await waitFor(() => {
      expect(screen.getByText('Apollo Care Pharmacy')).toBeInTheDocument();
      expect(screen.getByText(/1.45 km away/i)).toBeInTheDocument();
      expect(screen.getByText(/24 Hours Open/i)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /get directions/i })).toHaveAttribute(
        'href',
        'https://www.google.com/maps/dir/?api=1&destination=17.43,78.405'
      );
    });
  });
});
