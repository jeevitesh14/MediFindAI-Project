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

    // Verify owner field is not in the registration form
    expect(screen.queryByText(/Assigned Pharmacy Owner/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Select an eligible owner/i)).not.toBeInTheDocument();

    // Verify responsive modal sizing and internal scroll structure
    const modalTitle = screen.getByText('Register New Pharmacy');
    const header = modalTitle.closest('.flex-shrink-0');
    expect(header).toBeInTheDocument();
    expect(header).toHaveClass('flex-shrink-0');

    const modalContainer = header.parentElement;
    expect(modalContainer).toHaveClass('flex', 'flex-col', 'overflow-hidden');
    expect(modalContainer.className).toMatch(/max-h-\[calc\(100dvh/);

    const form = modalContainer.querySelector('form');
    expect(form).toHaveClass('flex', 'flex-col', 'flex-1', 'min-h-0', 'overflow-hidden');

    const scrollableBody = form.querySelector('.overflow-y-auto');
    expect(scrollableBody).toBeInTheDocument();
    expect(scrollableBody).toHaveClass('flex-1', 'min-h-0', 'overflow-y-auto');

    const footer = form.querySelector('.border-t.bg-slate-900\\/95');
    expect(footer).toBeInTheDocument();
    expect(footer).toHaveClass('flex-shrink-0');
    expect(footer).toContainElement(screen.getByRole('button', { name: /Cancel/i }));
    expect(footer).toContainElement(screen.getByRole('button', { name: /Register Pharmacy/i }));

    // Verify body scroll lock is applied
    expect(document.body.style.overflow).toBe('hidden');

    // Close modal and verify body scroll lock is removed
    const closeBtn = screen.getByLabelText('Close modal');
    fireEvent.click(closeBtn);
    expect(document.body.style.overflow).toBe('');
  });

  it('submits pharmacy registration without an owner', async () => {
    adminService.createPharmacy.mockResolvedValue({
      id: 3,
      name: 'CarePlus Direct',
      licenseNumber: 'LIC-CP-999',
      addressLine: 'Road 1',
      city: 'Hyderabad',
      state: 'Telangana',
      phone: '9999888877',
      active: true,
      verificationStatus: 'VERIFIED',
    });

    render(
      <BrowserRouter>
        <AdminPharmacies />
      </BrowserRouter>
    );

    const addButtons = screen.getAllByRole('button', { name: /Add New Pharmacy/i });
    fireEvent.click(addButtons[0]);

    fireEvent.change(screen.getByPlaceholderText(/e\.g\. Apollo Care Pharmacy/i), {
      target: { value: 'CarePlus Direct' },
    });
    fireEvent.change(screen.getByPlaceholderText(/e\.g\. LIC-TS-10023/i), {
      target: { value: 'LIC-CP-999' },
    });
    fireEvent.change(screen.getByPlaceholderText(/e\.g\. 9100000001/i), {
      target: { value: '9999888877' },
    });
    fireEvent.change(screen.getByPlaceholderText(/Road No\. 12, Banjara Hills/i), {
      target: { value: 'Road 1' },
    });

    const submitBtn = screen.getByRole('button', { name: /Register Pharmacy/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(adminService.createPharmacy).toHaveBeenCalled();
      const callArg = adminService.createPharmacy.mock.calls[0][0];
      expect(callArg.name).toBe('CarePlus Direct');
      expect(callArg.ownerId).toBeUndefined();
    });
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
