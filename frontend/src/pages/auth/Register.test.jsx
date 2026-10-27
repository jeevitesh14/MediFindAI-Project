import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { BrowserRouter } from 'react-router-dom';
import Register from './Register';
import authReducer from '../../store/slices/authSlice';
import * as authSlice from '../../store/slices/authSlice';

function renderRegister(initialState = {}) {
  const store = configureStore({
    reducer: {
      auth: authReducer,
    },
    preloadedState: {
      auth: {
        user: null,
        accessToken: null,
        isAuthenticated: false,
        status: 'idle',
        error: null,
        ...initialState,
      },
    },
  });

  return {
    store,
    ...render(
      <Provider store={store}>
        <BrowserRouter>
          <Register />
        </BrowserRouter>
      </Provider>
    ),
  };
}

describe('Register Page - Mandatory Phone Number & Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders Phone Number * label and placeholder', () => {
    renderRegister();

    expect(screen.getByText(/PHONE NUMBER \*/i)).toBeInTheDocument();
    const phoneInput = screen.getByPlaceholderText('Enter your 10-digit mobile number');
    expect(phoneInput).toBeInTheDocument();
    expect(phoneInput).toHaveAttribute('type', 'text');
  });

  it('shows required validation error when phone number is empty', async () => {
    renderRegister();

    fireEvent.change(screen.getByPlaceholderText('Dr. John Doe'), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByPlaceholderText('you@example.com'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getAllByPlaceholderText('••••••••')[0], { target: { value: 'password123' } });
    fireEvent.change(screen.getAllByPlaceholderText('••••••••')[1], { target: { value: 'password123' } });

    // Click submit without entering phone
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText(/phone number is required/i)).toBeInTheDocument();
    });
  });

  it('shows invalid format error when phone is malformed or less than 10 digits', async () => {
    renderRegister();

    fireEvent.change(screen.getByPlaceholderText('Dr. John Doe'), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByPlaceholderText('you@example.com'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('Enter your 10-digit mobile number'), { target: { value: '12345' } });
    fireEvent.change(screen.getAllByPlaceholderText('••••••••')[0], { target: { value: 'password123' } });
    fireEvent.change(screen.getAllByPlaceholderText('••••••••')[1], { target: { value: 'password123' } });

    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText(/please enter a valid 10-digit mobile number/i)).toBeInTheDocument();
    });
  });

  it('shows password mismatch error when confirm password does not match', async () => {
    renderRegister();

    fireEvent.change(screen.getByPlaceholderText('Dr. John Doe'), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByPlaceholderText('you@example.com'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('Enter your 10-digit mobile number'), { target: { value: '9876543210' } });
    fireEvent.change(screen.getAllByPlaceholderText('••••••••')[0], { target: { value: 'password123' } });
    fireEvent.change(screen.getAllByPlaceholderText('••••••••')[1], { target: { value: 'different123' } });

    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });
  });

  it('normalizes +91 country prefix and dispatches registration with clean 10-digit number', async () => {
    const registerSpy = vi.spyOn(authSlice, 'registerUser');

    renderRegister();

    fireEvent.change(screen.getByPlaceholderText('Dr. John Doe'), { target: { value: 'Test Indian User' } });
    fireEvent.change(screen.getByPlaceholderText('you@example.com'), { target: { value: 'indian@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('Enter your 10-digit mobile number'), { target: { value: '+91 9876543210' } });
    fireEvent.change(screen.getAllByPlaceholderText('••••••••')[0], { target: { value: 'password123' } });
    fireEvent.change(screen.getAllByPlaceholderText('••••••••')[1], { target: { value: 'password123' } });

    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(registerSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          fullName: 'Test Indian User',
          email: 'indian@example.com',
          phone: '9876543210',
          role: 'USER',
        })
      );
    });
  });

  it('allows selecting Pharmacy Owner role and dispatches with PHARMACY_OWNER role', async () => {
    const registerSpy = vi.spyOn(authSlice, 'registerUser');

    renderRegister();

    // Toggle role to Pharmacy Owner
    fireEvent.click(screen.getByRole('button', { name: /pharmacy owner/i }));

    fireEvent.change(screen.getByPlaceholderText('Dr. John Doe'), { target: { value: 'Pharmacy Owner' } });
    fireEvent.change(screen.getByPlaceholderText('you@example.com'), { target: { value: 'owner@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('Enter your 10-digit mobile number'), { target: { value: '9988776655' } });
    fireEvent.change(screen.getAllByPlaceholderText('••••••••')[0], { target: { value: 'ownerPass123' } });
    fireEvent.change(screen.getAllByPlaceholderText('••••••••')[1], { target: { value: 'ownerPass123' } });

    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(registerSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          fullName: 'Pharmacy Owner',
          email: 'owner@example.com',
          phone: '9988776655',
          role: 'PHARMACY_OWNER',
        })
      );
    });
  });
});
