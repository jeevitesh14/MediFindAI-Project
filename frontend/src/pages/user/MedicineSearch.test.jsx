import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import store from '../../store/store';
import MedicineSearch from './MedicineSearch';
import apiClient from '../../api/axiosConfig';

vi.mock('../../api/axiosConfig');

describe('MedicineSearch Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders search input, voice microphone button, and header banner', () => {
    render(
      <Provider store={store}>
        <BrowserRouter>
          <MedicineSearch />
        </BrowserRouter>
      </Provider>
    );

    expect(screen.getByPlaceholderText(/type at least 2 characters/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^search$/i })).toBeInTheDocument();
    expect(screen.getByText(/Medicine Autocomplete Search/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Upload Prescription/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /search medicine with voice|voice search/i })).toBeInTheDocument();
  });

  it('renders popular search chips when no results yet', () => {
    render(
      <Provider store={store}>
        <BrowserRouter>
          <MedicineSearch />
        </BrowserRouter>
      </Provider>
    );

    const matches = screen.getAllByText(/Paracetamol 500mg/i);
    expect(matches.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Azithromycin 500mg/i)).toBeInTheDocument();
  });

  it('opens prescription upload modal with privacy notice when Upload Prescription clicked', async () => {
    render(
      <Provider store={store}>
        <BrowserRouter>
          <MedicineSearch />
        </BrowserRouter>
      </Provider>
    );

    const uploadBtn = screen.getByRole('button', { name: /Upload Prescription/i });
    fireEvent.click(uploadBtn);

    await waitFor(() => {
      expect(screen.getByText(/Upload Prescription & Extract Medicines/i)).toBeInTheDocument();
      expect(screen.getByText(/Prescription images may contain sensitive health information/i)).toBeInTheDocument();
    });
  });

  it('fetches and displays medicines and pharmacy prices on search submit', async () => {
    const mockMedicines = [
      {
        id: 1,
        name: 'Paracetamol 500mg',
        genericName: 'Paracetamol',
        dosageForm: 'Tablet',
        strength: '500mg',
        manufacturer: 'Cipla Ltd',
        requiresPrescription: false,
        pharmacies: [
          {
            pharmacyId: 10,
            pharmacyName: 'Apollo Care Pharmacy',
            address: 'Road 12',
            city: 'Hyderabad',
            price: 25.0,
            quantity: 200,
            stockStatus: 'AVAILABLE',
          },
        ],
      },
    ];

    apiClient.get.mockResolvedValueOnce({
      data: {
        success: true,
        data: mockMedicines,
      },
    });

    render(
      <Provider store={store}>
        <BrowserRouter>
          <MedicineSearch />
        </BrowserRouter>
      </Provider>
    );

    const input = screen.getByPlaceholderText(/type at least 2 characters/i);
    fireEvent.change(input, { target: { value: 'par' } });

    const searchBtn = screen.getByRole('button', { name: /^search$/i });
    fireEvent.click(searchBtn);

    await waitFor(() => {
      expect(screen.getByText(/Apollo Care Pharmacy/i)).toBeInTheDocument();
      expect(screen.getAllByText(/25\.00/).length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText(/200 in stock/i)).toBeInTheDocument();
    });
  });
});
