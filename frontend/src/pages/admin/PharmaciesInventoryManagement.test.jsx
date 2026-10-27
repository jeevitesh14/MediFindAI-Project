import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import AdminPharmacies from './Pharmacies';
import adminService from '../../services/adminService';
import '../../i18n/i18n';

vi.mock('../../services/adminService', () => ({
  default: {
    getPharmacies: vi.fn(),
    getPharmacyDetails: vi.fn(),
    getPharmacyInventory: vi.fn(),
    getPharmacyReservations: vi.fn(),
    getPharmacyOwners: vi.fn(),
    createPharmacy: vi.fn(),
    updatePharmacy: vi.fn(),
    togglePharmacyActive: vi.fn(),
    assignPharmacyOwner: vi.fn(),
    verifyPharmacy: vi.fn(),
    deletePharmacy: vi.fn(),
    addPharmacyInventory: vi.fn(),
    updatePharmacyInventory: vi.fn(),
    updatePharmacyStockQuantity: vi.fn(),
    updatePharmacyStockPrice: vi.fn(),
    deletePharmacyInventory: vi.fn(),
    getMedicines: vi.fn(),
    createMedicine: vi.fn(),
  },
}));

describe('Admin Pharmacy & Inventory Management Module', () => {
  const mockPharmacies = [
    {
      id: 101,
      name: 'Apollo Care Pharmacy Banjara',
      licenseNumber: 'LIC-HYD-9988',
      description: 'Super-specialty community pharmacy.',
      addressLine: 'Road No. 10, Banjara Hills',
      city: 'Hyderabad',
      state: 'Telangana',
      postalCode: '500034',
      phone: '9800000001',
      email: 'apollo.banjara@example.com',
      verificationStatus: 'VERIFIED',
      totalMedicinesStocked: 2,
      is24Hours: true,
      active: true,
    },
    {
      id: 102,
      name: 'MedPlus Express Kukatpally',
      licenseNumber: 'LIC-HYD-7766',
      description: 'Standard retail pharmacy.',
      addressLine: 'KPHB Phase 1',
      city: 'Hyderabad',
      state: 'Telangana',
      postalCode: '500072',
      phone: '9800000002',
      email: 'medplus.kukatpally@example.com',
      verificationStatus: 'VERIFIED',
      totalMedicinesStocked: 1,
      is24Hours: false,
      openingTime: '08:00',
      closingTime: '22:00',
      active: true,
    },
  ];

  const mockInventoryP1 = [
    {
      id: 501,
      medicineId: 11,
      medicineName: 'Paracetamol 650mg',
      genericName: 'Acetaminophen',
      manufacturer: 'Cipla Ltd',
      category: 'Analgesics',
      dosageForm: 'Tablet',
      strength: '650mg',
      requiresPrescription: false,
      quantity: 120,
      price: 32.5,
      stockStatus: 'AVAILABLE',
      lowStockThreshold: 15,
    },
    {
      id: 502,
      medicineId: 12,
      medicineName: 'Azithromycin 500mg',
      genericName: 'Azithromycin',
      manufacturer: 'Sun Pharma',
      category: 'Antibiotics',
      dosageForm: 'Tablet',
      strength: '500mg',
      requiresPrescription: true,
      quantity: 4,
      price: 115.0,
      stockStatus: 'LOW_STOCK',
      lowStockThreshold: 10,
    },
  ];

  const mockReservationsP1 = [
    {
      id: 901,
      reservationCode: 'RES-HYD-9001',
      customerId: 301,
      customerName: 'Kavita Rao',
      customerPhone: '9848012345',
      medicineId: 11,
      medicineName: 'Paracetamol 650mg',
      dosageForm: 'Tablet',
      strength: '650mg',
      requiresPrescription: false,
      quantity: 2,
      unitPrice: 32.5,
      totalPrice: 65.0,
      status: 'PENDING',
      createdAt: '2026-10-26T10:00:00Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    adminService.getPharmacies.mockResolvedValue(mockPharmacies);
    adminService.getPharmacyOwners.mockResolvedValue([]);
    adminService.getPharmacyDetails.mockResolvedValue({
      ...mockPharmacies[0],
      totalMedicinesStocked: 2,
      totalReservations: 1,
      lowStockItemsCount: 1,
    });
    adminService.getPharmacyInventory.mockResolvedValue(mockInventoryP1);
    adminService.getPharmacyReservations.mockResolvedValue(mockReservationsP1);
    adminService.getMedicines.mockResolvedValue([
      {
        id: 13,
        name: 'Amoxicillin 500mg',
        genericName: 'Amoxicillin Trihydrate',
        manufacturer: 'Alkem Laboratories',
        dosageForm: 'Capsule',
        strength: '500mg',
        requiresPrescription: true,
      },
    ]);
  });

  it('renders pharmacy list with live operating hours, catalog count, and quick stock action buttons', async () => {
    render(
      <BrowserRouter>
        <AdminPharmacies />
      </BrowserRouter>
    );

    expect(await screen.findByText('Apollo Care Pharmacy Banjara')).toBeInTheDocument();
    expect(screen.getByText('MedPlus Express Kukatpally')).toBeInTheDocument();
    expect(screen.getByText('24/7 Active')).toBeInTheDocument();

    // Verify "+ Stock Medicine" top bar button exists
    expect(screen.getByText('+ Stock Medicine')).toBeInTheDocument();

    // Verify "Manage Stock" action buttons exist on cards
    const manageStockButtons = screen.getAllByText('Manage Stock');
    expect(manageStockButtons.length).toBeGreaterThan(0);
  });

  it('opens inventory tab in details modal and renders inventory items correctly', async () => {
    render(
      <BrowserRouter>
        <AdminPharmacies />
      </BrowserRouter>
    );

    const manageStockButtons = await screen.findAllByText('Manage Stock');
    fireEvent.click(manageStockButtons[0]);

    // Modal opens and shows inventory items
    expect(await screen.findByText('Paracetamol 650mg')).toBeInTheDocument();
    expect(screen.getByText('Azithromycin 500mg')).toBeInTheDocument();
    expect(screen.getByText('₹32.50')).toBeInTheDocument();
    expect(screen.getByText('₹115.00')).toBeInTheDocument();

    // Verify status badges
    expect(screen.getByText('AVAILABLE')).toBeInTheDocument();
    expect(screen.getByText('LOW STOCK')).toBeInTheDocument();
  });

  it('allows filtering inventory by stock status and searching by medicine name', async () => {
    render(
      <BrowserRouter>
        <AdminPharmacies />
      </BrowserRouter>
    );

    const manageStockButtons = await screen.findAllByText('Manage Stock');
    fireEvent.click(manageStockButtons[0]);

    await screen.findByText('Paracetamol 650mg');

    // Filter by Low Stock
    const lowStockPill = screen.getByRole('button', { name: /Low Stock \(1\)/i });
    fireEvent.click(lowStockPill);

    // Azithromycin should be present, Paracetamol should be filtered out
    expect(screen.getByText('Azithromycin 500mg')).toBeInTheDocument();
    expect(screen.queryByText('Paracetamol 650mg')).not.toBeInTheDocument();

    // Switch back to All
    const allStockPill = screen.getByRole('button', { name: /All \(2\)/i });
    fireEvent.click(allStockPill);
    expect(screen.getByText('Paracetamol 650mg')).toBeInTheDocument();

    // Search for Paracetamol
    const searchInput = screen.getByPlaceholderText(/Search stocked medicines by name/i);
    fireEvent.change(searchInput, { target: { value: 'Paracetamol' } });

    expect(screen.getByText('Paracetamol 650mg')).toBeInTheDocument();
    expect(screen.queryByText('Azithromycin 500mg')).not.toBeInTheDocument();
  });

  it('handles quick stock increment and decrement', async () => {
    adminService.updatePharmacyStockQuantity.mockResolvedValue({
      ...mockInventoryP1[0],
      quantity: 130,
    });

    render(
      <BrowserRouter>
        <AdminPharmacies />
      </BrowserRouter>
    );

    const manageStockButtons = await screen.findAllByText('Manage Stock');
    fireEvent.click(manageStockButtons[0]);

    const paracetamolText = await screen.findByText('Paracetamol 650mg');
    const paracetamolRow = paracetamolText.closest('tr');

    // Click +10 quick button for Paracetamol within its row
    const plusTenBtn = within(paracetamolRow).getByTitle('Quick add +10 stock');
    fireEvent.click(plusTenBtn);

    await waitFor(() => {
      expect(adminService.updatePharmacyStockQuantity).toHaveBeenCalledWith(101, 501, 130);
    });
  });

  it('opens Add Medicine modal and stocks a medicine into the pharmacy', async () => {
    adminService.addPharmacyInventory.mockResolvedValue({
      id: 503,
      medicineId: 13,
      medicineName: 'Amoxicillin 500mg',
      genericName: 'Amoxicillin Trihydrate',
      dosageForm: 'Capsule',
      strength: '500mg',
      price: 55.0,
      quantity: 80,
      stockStatus: 'AVAILABLE',
      lowStockThreshold: 10,
    });

    render(
      <BrowserRouter>
        <AdminPharmacies />
      </BrowserRouter>
    );

    // Open Top Bar "+ Stock Medicine" button
    const addMedBtn = await screen.findByText('+ Stock Medicine');
    fireEvent.click(addMedBtn);

    expect(await screen.findByText('Add Medicine to Pharmacy')).toBeInTheDocument();

    // Search for Amoxicillin
    const searchCatalogInput = screen.getByPlaceholderText(/Type medicine name or generic molecule/i);
    fireEvent.change(searchCatalogInput, { target: { value: 'Amoxicillin' } });

    // Wait for dropdown suggestion and select it
    const selectBtn = await screen.findByText('Select →');
    fireEvent.click(selectBtn);

    expect(screen.getByText('Amoxicillin 500mg')).toBeInTheDocument();

    // Fill in Price and Quantity
    const priceInput = screen.getByPlaceholderText('0.00');
    fireEvent.change(priceInput, { target: { value: '55.00' } });

    // Submit form
    const stockBtn = screen.getByRole('button', { name: /Stock Medicine in Store/i });
    fireEvent.click(stockBtn);

    await waitFor(() => {
      expect(adminService.addPharmacyInventory).toHaveBeenCalledWith(
        101,
        expect.objectContaining({
          medicineId: 13,
          price: 55.0,
          quantity: 50,
          lowStockThreshold: 10,
        })
      );
    });
  });

  it('opens Edit Inventory modal and saves updated price and stock level', async () => {
    adminService.updatePharmacyInventory.mockResolvedValue({
      ...mockInventoryP1[0],
      price: 35.0,
      quantity: 170,
    });

    render(
      <BrowserRouter>
        <AdminPharmacies />
      </BrowserRouter>
    );

    const manageStockButtons = await screen.findAllByText('Manage Stock');
    fireEvent.click(manageStockButtons[0]);

    const paracetamolText = await screen.findByText('Paracetamol 650mg');
    const paracetamolRow = paracetamolText.closest('tr');

    // Click edit pencil button within Paracetamol row
    const editBtn = within(paracetamolRow).getByTitle('Edit Price & Stock');
    fireEvent.click(editBtn);

    expect(await screen.findByText('Edit Medicine Stock & Price')).toBeInTheDocument();

    // Adjust stock with +50 quick chip
    const plusFiftyChip = screen.getByRole('button', { name: '+50' });
    fireEvent.click(plusFiftyChip);

    // Submit
    const saveChangesBtn = screen.getByRole('button', { name: /Save Inventory Changes/i });
    fireEvent.click(saveChangesBtn);

    await waitFor(() => {
      expect(adminService.updatePharmacyInventory).toHaveBeenCalledWith(
        101,
        501,
        expect.objectContaining({
          quantity: 170,
          price: 32.5,
        })
      );
    });
  });

  it('opens Remove Inventory modal with safe confirmation and handles removal', async () => {
    adminService.deletePharmacyInventory.mockResolvedValue({});

    render(
      <BrowserRouter>
        <AdminPharmacies />
      </BrowserRouter>
    );

    const manageStockButtons = await screen.findAllByText('Manage Stock');
    fireEvent.click(manageStockButtons[0]);

    const paracetamolText = await screen.findByText('Paracetamol 650mg');
    const paracetamolRow = paracetamolText.closest('tr');

    // Click trash button within Paracetamol row
    const trashBtn = within(paracetamolRow).getByTitle('Remove from Store');
    fireEvent.click(trashBtn);

    expect(await screen.findByText('Remove Medicine from Pharmacy?')).toBeInTheDocument();
    expect(screen.getByText('Central Catalog Record Safe')).toBeInTheDocument();

    // Confirm remove
    const confirmRemoveBtn = screen.getByRole('button', { name: /Confirm Remove/i });
    fireEvent.click(confirmRemoveBtn);

    await waitFor(() => {
      expect(adminService.deletePharmacyInventory).toHaveBeenCalledWith(101, 501);
    });
  });

  it('renders pharmacy reservations tab with patient hold information', async () => {
    render(
      <BrowserRouter>
        <AdminPharmacies />
      </BrowserRouter>
    );

    // Click the dedicated Reservations button on the pharmacy card
    const viewResButtons = await screen.findAllByTitle('View Pharmacy Reservations');
    fireEvent.click(viewResButtons[0]);

    expect(await screen.findByText('RES-HYD-9001')).toBeInTheDocument();
    expect(screen.getByText('Kavita Rao')).toBeInTheDocument();
    expect(screen.getByText('Pending Hold')).toBeInTheDocument();
    expect(screen.getByText('₹65.00')).toBeInTheDocument();
  });
});

