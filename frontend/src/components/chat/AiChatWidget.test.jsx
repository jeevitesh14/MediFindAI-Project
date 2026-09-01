import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AiChatWidget from './AiChatWidget';
import apiClient from '../../api/axiosConfig';

vi.mock('../../api/axiosConfig');

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
    expect(screen.getByText(/Ask about medicine availability/i)).toBeInTheDocument();
    expect(screen.getByText(/MediFindAI does not provide medical advice/i)).toBeInTheDocument();
    expect(screen.getByText('Find Paracetamol')).toBeInTheDocument();
  });

  it('sends user message and displays response safely', async () => {
    apiClient.post.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          reply: 'Paracetamol 500mg is in stock at 3 partner pharmacies.',
          disclaimer: 'MediFindAI does not provide medical advice. Consult a qualified healthcare professional for medical guidance.',
          suggestedActions: ['Find Paracetamol'],
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
    fireEvent.change(input, { target: { value: 'Find Paracetamol' } });

    const sendBtn = screen.getByRole('button', { name: /send message/i });
    fireEvent.click(sendBtn);

    await waitFor(() => {
      expect(screen.getByText(/Paracetamol 500mg is in stock at 3 partner pharmacies/i)).toBeInTheDocument();
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

    expect(screen.queryByText('Ask about medicine availability')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /open medifindai assistant/i })).toBeInTheDocument();
  });
});
