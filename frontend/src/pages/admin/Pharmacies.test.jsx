import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import AdminPharmacies from './Pharmacies';
import adminService from '../../services/adminService';
import '../../i18n/i18n';

vi.mock('../../services/adminService', () => ({
  default: {
    getPharmacies: vi.fn(),
    verifyPharmacy: vi.fn(),
    deletePharmacy: vi.fn(),
    getPharmacyOwners: vi.fn(),
    createPharmacy: vi.fn(),
    updatePharmacy: vi.fn(),
    togglePharmacyActive: vi.fn(),
    getPharmacyDetails: vi.fn(),
    getPharmacyInventory: vi.fn(),
    assignPharmacyOwner: vi.fn(),
  },
}));

describe('AdminPharmacies Component', () => {
  const mockPharmacies = [
    {
      id: 1,
      name: 'Apollo Care Pharmacy',
      licenseNumber: 'LIC-TS-10023',
      description: 'Trusted neighbourhood pharmacy.',
      addressLine: 'Road No. 12, Banjara Hills',
      city: 'Hyderabad',
      state: 'Telangana',
      postalCode: '500034',
      phone: '9100000001',
      email: 'contact@apollocare.example.com',
      verificationStatus: 'VERIFIED',
      totalMedicinesStocked: 14,
      is24Hours: true,
      active: true,
    },
    {
      id: 2,
      name: 'MedPlus Express',
      licenseNumber: 'LIC-TS-10044',
      description: '24/7 express medicine counter.',
      addressLine: 'Kukatpally Main Rd',
      city: 'Hyderabad',
      state: 'Telangana',
      postalCode: '500072',
      phone: '9100000002',
      email: 'contact@medplus.example.com',
      verificationStatus: 'PENDING',
      totalMedicinesStocked: 5,
      is24Hours: false,
      active: false,
    },
  ];

  const mockOwners = [
    { id: 2, fullName: 'Apollo Admin', email: 'owner@apollocare.example.com', phone: '9100000001', role: 'PHARMACY_OWNER' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    adminService.getPharmacies.mockResolvedValue(mockPharmacies);
    adminService.getPharmacyOwners.mockResolvedValue(mockOwners);
    adminService.togglePharmacyActive.mockResolvedValue({ id: 1, active: false });
    adminService.getPharmacyDetails.mockResolvedValue({
      id: 1,
      name: 'Apollo Care Pharmacy',
      licenseNumber: 'LIC-TS-10023',
      city: 'Hyderabad',
      state: 'Telangana',
      addressLine: 'Road No. 12, Banjara Hills',
      phone: '9100000001',
      email: 'contact@apollocare.example.com',
      active: true,
      verificationStatus: 'VERIFIED',
      ownerName: 'Apollo Admin',
      ownerEmail: 'owner@apollocare.example.com',
      totalMedicinesStocked: 14,
      totalReservations: 5,
      totalOrders: 2,
    });
    adminService.getPharmacyInventory.mockResolvedValue([]);
  });

  it('renders pharmacy partner header, search input, and status filters', async () => {
    render(
      <BrowserRouter>
        <AdminPharmacies />
      </BrowserRouter>
    );

    expect(screen.getByText('Pharmacy Partners')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Search by pharmacy name/i)).toBeInTheDocument();
    expect(screen.getByText('All Statuses')).toBeInTheDocument();
    expect(screen.getByText('Pending Review')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Apollo Care Pharmacy')).toBeInTheDocument();
      expect(screen.getByText('MedPlus Express')).toBeInTheDocument();
    });
  });

  it('opens delete confirmation modal when Remove Pharmacy is clicked', async () => {
    render(
      <BrowserRouter>
        <AdminPharmacies />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Apollo Care Pharmacy')).toBeInTheDocument();
    });

    const removeButtons = screen.getAllByRole('button', { name: /Remove Pharmacy/i });
    expect(removeButtons.length).toBeGreaterThan(0);
    fireEvent.click(removeButtons[0]);

    expect(screen.getByText(/Are you sure you want to permanently remove/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Confirm Remove/i })).toBeInTheDocument();
  });

  it('opens verification modal when Verify / Review is clicked', async () => {
    render(
      <BrowserRouter>
        <AdminPharmacies />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('MedPlus Express')).toBeInTheDocument();
    });

    const reviewButtons = screen.getAllByRole('button', { name: /Verify \/ Review/i });
    expect(reviewButtons.length).toBeGreaterThan(0);
    fireEvent.click(reviewButtons[1]);

    expect(screen.getByText('Review Pharmacy License')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Approve \(Verified\)/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Reject License/i })).toBeInTheDocument();
  });

  it('opens Add Pharmacy modal when Add New Pharmacy button is clicked', async () => {
    render(
      <BrowserRouter>
        <AdminPharmacies />
      </BrowserRouter>
    );

    const addButtons = screen.getAllByRole('button', { name: /Add New Pharmacy/i });
    expect(addButtons.length).toBeGreaterThan(0);
    fireEvent.click(addButtons[0]);

    expect(screen.getByText('Register New Pharmacy')).toBeInTheDocument();
    expect(screen.getByText('1. Basic Information')).toBeInTheDocument();
    expect(screen.getByText('2. Contact & Location')).toBeInTheDocument();
    expect(screen.getByText('3. Operations & Status')).toBeInTheDocument();
  });

  it('calls togglePharmacyActive when the status toggle button is clicked', async () => {
    render(
      <BrowserRouter>
        <AdminPharmacies />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Apollo Care Pharmacy')).toBeInTheDocument();
    });

    const toggleButton = screen.getByTitle('Click to deactivate');
    fireEvent.click(toggleButton);

    await waitFor(() => {
      expect(adminService.togglePharmacyActive).toHaveBeenCalledWith(1, false);
    });
  });

  it('opens pharmacy details profile modal when View Details button is clicked', async () => {
    render(
      <BrowserRouter>
        <AdminPharmacies />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Apollo Care Pharmacy')).toBeInTheDocument();
    });

    const viewButtons = screen.getAllByTitle('View Pharmacy Profile');
    expect(viewButtons.length).toBeGreaterThan(0);
    fireEvent.click(viewButtons[0]);

    await waitFor(() => {
      expect(adminService.getPharmacyDetails).toHaveBeenCalledWith(1);
      expect(screen.getByText('Store Profile & Owner')).toBeInTheDocument();
    });
  });
});
