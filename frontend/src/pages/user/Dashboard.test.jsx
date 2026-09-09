import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import store from '../../store/store';
import UserDashboard from './Dashboard';

describe('UserDashboard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders welcome hero banner, search input, and stats cards without crashing', () => {
    render(
      <Provider store={store}>
        <BrowserRouter>
          <UserDashboard />
        </BrowserRouter>
      </Provider>
    );

    // Verify Welcome text
    expect(screen.getByText(/Welcome back/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Search medicine or speak/i)).toBeInTheDocument();

    // Verify stats cards rendered properly (including My Orders with FiPackage)
    expect(screen.getByText(/Active Reservations/i)).toBeInTheDocument();
    expect(screen.getByText(/My Orders/i)).toBeInTheDocument();
    expect(screen.getByText(/Saved Pharmacies/i)).toBeInTheDocument();
    expect(screen.getByText(/Live Alerts & Stock/i)).toBeInTheDocument();

    // Verify feature action cards
    expect(screen.getByText(/Medicine Autocomplete & Search/i)).toBeInTheDocument();
    expect(screen.getByText(/Prescription OCR Scan/i)).toBeInTheDocument();
    expect(screen.getByText(/MediFindAI Assistant/i)).toBeInTheDocument();
  });

  it('allows entering search query in the quick search bar', () => {
    render(
      <Provider store={store}>
        <BrowserRouter>
          <UserDashboard />
        </BrowserRouter>
      </Provider>
    );

    const input = screen.getByPlaceholderText(/Search medicine or speak/i);
    fireEvent.change(input, { target: { value: 'Paracetamol 650mg' } });
    expect(input.value).toBe('Paracetamol 650mg');
  });
});
