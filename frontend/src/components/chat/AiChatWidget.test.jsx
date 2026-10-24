import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AiChatWidget from './AiChatWidget';
import apiClient from '../../api/axiosConfig';

vi.mock('../../api/axiosConfig');

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('AiChatWidget Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders floating chat button with accessible label', () => {
    render(
      <BrowserRouter>
        <AiChatWidget />
      </BrowserRouter>
    );

    const button = screen.getByRole('button', { name: /open medifindai assistant/i });
    expect(button).toBeInTheDocument();
  });

  it('opens chat dialog when floating button is clicked', () => {
    render(
      <BrowserRouter>
        <AiChatWidget />
      </BrowserRouter>
    );

    const button = screen.getByRole('button', { name: /open medifindai assistant/i });
    fireEvent.click(button);

    expect(screen.getByText('MediFindAI Assistant')).toBeInTheDocument();
    expect(screen.getByText(/Ask questions or request medicine availability/i)).toBeInTheDocument();
    expect(screen.getByText(/MediFindAI does not provide medical advice/i)).toBeInTheDocument();
    expect(screen.getByText('Find Paracetamol')).toBeInTheDocument();
  });

  it('sends conversational question and displays response inside chat without navigating', async () => {
    apiClient.post.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          reply: 'Paracetamol is used to relieve mild-to-moderate pain and reduce fever.',
          intent: 'MEDICAL_INFORMATION',
          disclaimer: 'MediFindAI does not provide medical advice.',
          actions: [],
        },
      },
    });

    render(
      <BrowserRouter>
        <AiChatWidget />
      </BrowserRouter>
    );

    const button = screen.getByRole('button', { name: /open medifindai assistant/i });
    fireEvent.click(button);

    const input = screen.getByPlaceholderText(/ask about medicine availability/i);
    fireEvent.change(input, { target: { value: 'What is Paracetamol used for?' } });

    const sendBtn = screen.getByRole('button', { name: /send message/i });
    fireEvent.click(sendBtn);

    await waitFor(() => {
      expect(screen.getByText(/Paracetamol is used to relieve mild-to-moderate pain and reduce fever/i)).toBeInTheDocument();
    });

    // Must NOT navigate on conversational question!
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('clicking "Find Paracetamol" suggestion sends chat message instead of redirecting', async () => {
    apiClient.post.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          reply: 'Paracetamol 500mg is available starting from ₹22.50 across 3 verified partner pharmacies.',
          intent: 'MEDICINE_SEARCH',
          medicineSummaries: [
            {
              id: 1,
              name: 'Paracetamol 500mg',
              genericName: 'Acetaminophen',
              dosageForm: 'Tablet',
              strength: '500mg',
              category: 'Analgesic',
              prescriptionRequired: false,
              minPrice: 22.50,
            },
          ],
          pharmacyCards: [
            {
              id: 10,
              name: 'Apollo Care Pharmacy',
              address: 'Banjara Hills',
              city: 'Hyderabad',
              phone: '9100000001',
              price: 22.50,
              inStock: true,
              stockQuantity: 25,
            },
          ],
        },
      },
    });

    render(
      <BrowserRouter>
        <AiChatWidget />
      </BrowserRouter>
    );

    const openBtn = screen.getByRole('button', { name: /open medifindai assistant/i });
    fireEvent.click(openBtn);

    // Click starter suggestion "Find Paracetamol"
    const findParacetamolBtn = screen.getByText('Find Paracetamol');
    fireEvent.click(findParacetamolBtn);

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith('/ai/chat', expect.objectContaining({
        message: 'Find Paracetamol',
      }));
      expect(screen.getByText(/Apollo Care Pharmacy/i)).toBeInTheDocument();
      expect(screen.getByText(/Acetaminophen/i)).toBeInTheDocument();
    });

    // Crucial requirement: clicking suggested button must NOT navigate!
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('clicking "Nearby Pharmacies" suggestion sends chat message instead of redirecting', async () => {
    apiClient.post.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          reply: 'Here are verified partner pharmacies near you with real-time stock sync:',
          intent: 'PHARMACY_SEARCH',
          pharmacyCards: [
            {
              id: 20,
              name: 'MedPlus Express',
              address: 'Jubilee Hills',
              city: 'Hyderabad',
              phone: '9100000002',
              price: 0,
              inStock: true,
              stockQuantity: 10,
            },
          ],
        },
      },
    });

    render(
      <BrowserRouter>
        <AiChatWidget />
      </BrowserRouter>
    );

    const openBtn = screen.getByRole('button', { name: /open medifindai assistant/i });
    fireEvent.click(openBtn);

    const nearbyBtn = screen.getByText('Nearby Pharmacies');
    fireEvent.click(nearbyBtn);

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith('/ai/chat', expect.objectContaining({
        message: 'What are nearby pharmacies?',
      }));
      expect(screen.getByText(/MedPlus Express/i)).toBeInTheDocument();
    });

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('explains prescription upload without navigating when user asks "How do I upload a prescription?"', async () => {
    apiClient.post.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          reply: 'MediFindAI features an intelligent AI Prescription Scanner (OCR).',
          intent: 'PRESCRIPTION_HELP',
          actions: [
            { label: 'Open Prescription Upload', action: 'NAVIGATE', payload: '/dashboard/search?upload=true', requiresAuth: false },
          ],
        },
      },
    });

    render(
      <BrowserRouter>
        <AiChatWidget />
      </BrowserRouter>
    );

    const openBtn = screen.getByRole('button', { name: /open medifindai assistant/i });
    fireEvent.click(openBtn);

    const uploadSuggestion = screen.getByText('Upload Prescription');
    fireEvent.click(uploadSuggestion);

    await waitFor(() => {
      expect(screen.getByText(/intelligent AI Prescription Scanner/i)).toBeInTheDocument();
      expect(screen.getByText('Open Prescription Upload')).toBeInTheDocument();
    });

    expect(mockNavigate).not.toHaveBeenCalled();

    // Now click the explicit navigation button: "Open Prescription Upload"
    const navBtn = screen.getByText('Open Prescription Upload');
    fireEvent.click(navBtn);

    expect(mockNavigate).toHaveBeenCalledWith('/dashboard/search?upload=true');
  });

  it('navigates when backend returns APP_NAVIGATION intent', async () => {
    apiClient.post.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          reply: 'Navigating to **Medicine Search**...',
          intent: 'APP_NAVIGATION',
          navigation: {
            targetRoute: '/dashboard/search',
            destinationName: 'Medicine Search',
            requiresAuth: false,
          },
        },
      },
    });

    render(
      <BrowserRouter>
        <AiChatWidget />
      </BrowserRouter>
    );

    const openBtn = screen.getByRole('button', { name: /open medifindai assistant/i });
    fireEvent.click(openBtn);

    const input = screen.getByPlaceholderText(/ask about medicine availability/i);
    fireEvent.change(input, { target: { value: 'Open medicine search' } });

    const sendBtn = screen.getByRole('button', { name: /send message/i });
    fireEvent.click(sendBtn);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard/search');
    });
  });

  it('closes chat when close button is clicked', () => {
    render(
      <BrowserRouter>
        <AiChatWidget />
      </BrowserRouter>
    );

    const openBtn = screen.getByRole('button', { name: /open medifindai assistant/i });
    fireEvent.click(openBtn);

    const closeBtn = screen.getByRole('button', { name: /close chat/i });
    fireEvent.click(closeBtn);

    expect(screen.queryByText(/Ask questions or request medicine availability/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /open medifindai assistant/i })).toBeInTheDocument();
  });
});
