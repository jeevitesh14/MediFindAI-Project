import { render, screen, fireEvent } from '@testing-library/react';
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

describe('AdminPharmacies Modal Viewport Responsiveness', () => {
  const viewports = [
    { name: '1536x864 (Standard Desktop)', width: 1536, height: 864 },
    { name: '1366x768 (Standard Laptop)', width: 1366, height: 768 },
    { name: '1280x720 (HD Laptop)', width: 1280, height: 720 },
    { name: '1024x768 (Tablet/Small Screen)', width: 1024, height: 768 },
    { name: '768x1024 (Tablet Portrait)', width: 768, height: 1024 },
    { name: '390x844 (Mobile)', width: 390, height: 844 },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    adminService.getPharmacies.mockResolvedValue([]);
    adminService.getPharmacyOwners.mockResolvedValue([]);
  });

  viewports.forEach(({ name, width, height }) => {
    it(`renders modal with responsive scrollable container at ${name}`, () => {
      window.innerWidth = width;
      window.innerHeight = height;
      window.dispatchEvent(new Event('resize'));

      render(
        <BrowserRouter>
          <AdminPharmacies />
        </BrowserRouter>
      );

      const addButtons = screen.getAllByRole('button', { name: /Add New Pharmacy/i });
      fireEvent.click(addButtons[0]);

      // 1. Header visible and sticky
      const headerTitle = screen.getByText('Register New Pharmacy');
      expect(headerTitle).toBeInTheDocument();
      const header = headerTitle.closest('.flex-shrink-0');
      expect(header).toHaveClass('flex-shrink-0');

      // 2. Modal container constrained by max-height
      const modalContainer = header.parentElement;
      expect(modalContainer).toHaveClass('flex', 'flex-col', 'overflow-hidden');
      expect(modalContainer.className).toContain('max-h-[calc(100dvh-2rem)]');

      // 3. Scrollable form body has min-h-0 and overflow-y-auto
      const form = modalContainer.querySelector('form');
      expect(form).toHaveClass('flex', 'flex-col', 'flex-1', 'min-h-0');

      const scrollableBody = form.querySelector('.overflow-y-auto');
      expect(scrollableBody).toHaveClass('flex-1', 'min-h-0', 'overflow-y-auto');

      // All sections are present inside the scrollable body
      expect(scrollableBody).toContainElement(screen.getByText('1. Basic Information'));
      expect(scrollableBody).toContainElement(screen.getByText('2. Contact & Location'));
      expect(scrollableBody).toContainElement(screen.getByText('3. Operations & Status'));

      // Checkboxes, inputs, and logo are inside the scrollable body
      expect(scrollableBody).toContainElement(screen.getByText(/24-Hour Pharmacy/i));
      expect(scrollableBody).toContainElement(screen.getByText(/Active for User Reservations/i));
      expect(scrollableBody).toContainElement(screen.getByPlaceholderText('https://.../logo.png'));

      // 4. Footer is fixed/sticky at the bottom and flex-shrink-0
      const footer = form.querySelector('.border-t.bg-slate-900\\/95');
      expect(footer).toBeInTheDocument();
      expect(footer).toHaveClass('flex-shrink-0');
      expect(footer).toContainElement(screen.getByRole('button', { name: /Cancel/i }));
      expect(footer).toContainElement(screen.getByRole('button', { name: /Register Pharmacy/i }));

      // 5. Body scroll lock
      expect(document.body.style.overflow).toBe('hidden');
    });
  });
});
