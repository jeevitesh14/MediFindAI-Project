import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import store from '../../store/store';
import PrescriptionUploadModal from './PrescriptionUploadModal';
import prescriptionService from '../../services/prescriptionService';
import useAuth from '../../hooks/useAuth';


vi.mock('../../services/prescriptionService');
vi.mock('../../hooks/useAuth');

describe('PrescriptionUploadModal Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: 1, email: 'patient@example.com', fullName: 'Test Patient' },
    });
  });


  it('renders privacy notice, file dropzone, and safety text when open', () => {
    render(
      <Provider store={store}>
        <BrowserRouter>
          <PrescriptionUploadModal
            isOpen={true}
            onClose={() => {}}
          />
        </BrowserRouter>
      </Provider>
    );

    expect(screen.getByText(/Upload Prescription & Extract Medicines/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Prescription images may contain sensitive health information/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Supported formats: JPG, JPEG, PNG, WEBP/i)
    ).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    render(
      <Provider store={store}>
        <BrowserRouter>
          <PrescriptionUploadModal
            isOpen={false}
            onClose={() => {}}
          />
        </BrowserRouter>
      </Provider>
    );

    expect(screen.queryByText(/Upload Prescription & Extract Medicines/i)).not.toBeInTheDocument();
  });

  it('displays extracted medicine matches and raw text accordion after scan', async () => {
    const mockScanData = {
      id: 10,
      imageUrl: '/uploads/prescriptions/sample.jpg',
      rawExtractedText: 'Rx Paracetamol 500mg 1 tab OD',
      detectedMedicineNames: ['Paracetamol 500mg'],
      matchedMedicines: [
        {
          id: 1,
          name: 'Paracetamol 500mg',
          genericName: 'Paracetamol',
          strength: '500mg',
          requiresPrescription: false,
          pharmacies: [
            {
              pharmacyId: 10,
              pharmacyName: 'Apollo Care',
              price: 25.0,
              quantity: 100,
              stockStatus: 'AVAILABLE',
            },
          ],
        },
      ],
      ocrProvider: 'GOOGLE_VISION',
      fallbackMode: false,
      disclaimer: 'Always verify prescription details with a pharmacist.',
    };

    prescriptionService.scanPrescription.mockResolvedValueOnce(mockScanData);

    const onSelectMedicine = vi.fn();

    render(
      <Provider store={store}>
        <BrowserRouter>
          <PrescriptionUploadModal
            isOpen={true}
            onClose={() => {}}
            onSelectMedicine={onSelectMedicine}
          />
        </BrowserRouter>
      </Provider>
    );

    // Mock selecting a valid file
    const file = new File(['dummy-image-data'], 'test-prescription.jpg', { type: 'image/jpeg' });
    const input = screen.getByLabelText(/Upload prescription image/i);
    fireEvent.change(input, { target: { files: [file] } });

    // Expect preview
    expect(screen.getByText(/test-prescription\.jpg/i)).toBeInTheDocument();

    const scanBtn = screen.getByRole('button', { name: /Extract & Match Medicines/i });
    fireEvent.click(scanBtn);

    await waitFor(() => {
      expect(screen.getByText(/Detected Medicines \(1\)/i)).toBeInTheDocument();
      expect(screen.getByText(/Always verify prescription details with a pharmacist/i)).toBeInTheDocument();
      expect(screen.getByText(/Raw Extracted OCR Text/i)).toBeInTheDocument();
    });

    const viewAvailBtn = screen.getByRole('button', { name: /View Availability & Prices/i });
    fireEvent.click(viewAvailBtn);
    expect(onSelectMedicine).toHaveBeenCalledWith('Paracetamol 500mg');
  });
});
