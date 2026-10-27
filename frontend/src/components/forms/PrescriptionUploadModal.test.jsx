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

  it('rejects unsupported file formats and displays error', () => {
    render(
      <Provider store={store}>
        <BrowserRouter>
          <PrescriptionUploadModal isOpen={true} onClose={() => {}} />
        </BrowserRouter>
      </Provider>
    );

    const pdfFile = new File(['dummy-pdf'], 'prescription.pdf', { type: 'application/pdf' });
    const input = screen.getByLabelText(/Upload prescription image/i);
    fireEvent.change(input, { target: { files: [pdfFile] } });

    expect(screen.getByText(/Only JPG, JPEG, PNG, and WEBP images are supported/i)).toBeInTheDocument();
  });

  it('allows removing selected image and returning to dropzone', () => {
    render(
      <Provider store={store}>
        <BrowserRouter>
          <PrescriptionUploadModal isOpen={true} onClose={() => {}} />
        </BrowserRouter>
      </Provider>
    );

    const file = new File(['dummy-image'], 'rx.png', { type: 'image/png' });
    const input = screen.getByLabelText(/Upload prescription image/i);
    fireEvent.change(input, { target: { files: [file] } });

    expect(screen.getByText(/rx\.png/i)).toBeInTheDocument();

    const removeBtn = screen.getByRole('button', { name: /Remove/i });
    fireEvent.click(removeBtn);

    expect(screen.queryByText(/rx\.png/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Click to browse or drag and drop prescription image/i)).toBeInTheDocument();
  });

  it('displays clear error notification when extraction service is unavailable', async () => {
    prescriptionService.scanPrescription.mockRejectedValueOnce({
      response: {
        status: 503,
        data: { message: 'The prescription extraction service is temporarily unavailable. Please try again.' },
      },
    });

    render(
      <Provider store={store}>
        <BrowserRouter>
          <PrescriptionUploadModal isOpen={true} onClose={() => {}} />
        </BrowserRouter>
      </Provider>
    );

    const file = new File(['dummy-image'], 'rx.jpg', { type: 'image/jpeg' });
    const input = screen.getByLabelText(/Upload prescription image/i);
    fireEvent.change(input, { target: { files: [file] } });

    const scanBtn = screen.getByRole('button', { name: /Extract & Match Medicines/i });
    fireEvent.click(scanBtn);

    await waitFor(() => {
      expect(
        screen.getByText(/The prescription extraction service is temporarily unavailable/i)
      ).toBeInTheDocument();
    });
  });

  it('renders unmatched medicines section when prescription contains uncataloged medicines', async () => {
    const mockScanData = {
      id: 11,
      imageUrl: '/uploads/prescriptions/sample2.jpg',
      rawExtractedText: 'Rx Lipitor 20mg 1 tab daily',
      detectedMedicineNames: ['Lipitor 20mg'],
      matchedMedicines: [],
      unmatchedMedicineNames: ['Lipitor 20mg'],
      statusMessage: 'Detected medicine names could not be found in our registered pharmacy inventory.',
      ocrProvider: 'GEMINI (gemini-3.5-flash)',
      fallbackMode: false,
      disclaimer: 'Always verify prescription details with a pharmacist.',
    };

    prescriptionService.scanPrescription.mockResolvedValueOnce(mockScanData);

    render(
      <Provider store={store}>
        <BrowserRouter>
          <PrescriptionUploadModal isOpen={true} onClose={() => {}} />
        </BrowserRouter>
      </Provider>
    );

    const file = new File(['dummy-image'], 'rx2.jpg', { type: 'image/jpeg' });
    const input = screen.getByLabelText(/Upload prescription image/i);
    fireEvent.change(input, { target: { files: [file] } });

    const scanBtn = screen.getByRole('button', { name: /Extract & Match Medicines/i });
    fireEvent.click(scanBtn);

    await waitFor(() => {
      expect(screen.getByText(/Prescribed medicines not in catalog \(1\)/i)).toBeInTheDocument();
      expect(screen.getByText('Lipitor 20mg')).toBeInTheDocument();
      expect(
        screen.getByText(/Detected medicine names could not be found in our registered pharmacy inventory/i)
      ).toBeInTheDocument();
    });
  });
});
