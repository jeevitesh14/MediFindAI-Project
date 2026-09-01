import { useState, useRef, useEffect } from 'react';
import { FiMessageSquare, FiX, FiSend, FiMinimize2, FiShield, FiCornerDownRight } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/axiosConfig';

const STARTER_PROMPTS = [
  'Find Paracetamol',
  'Which pharmacy has medicine in stock?',
  'Do I need a prescription?',
];

const SAFETY_TEXT = 'MediFindAI does not provide medical advice. Consult a qualified healthcare professional for medical guidance.';

export default function AiChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'Hello! I am your MediFindAI Assistant. How can I help you find medicines, check live pharmacy stock, or compare prices today?',
      disclaimer: SAFETY_TEXT,
      suggestedActions: STARTER_PROMPTS,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages, isTyping]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleSendMessage = async (userText) => {
    const messageText = (userText || input).trim();
    if (!messageText || isTyping) return;

    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: messageText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      // Call backend AI endpoint
      const response = await apiClient.post('/ai/chat', {
        message: messageText,
      });

      const data = response?.data?.data;
      const botMessage = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        text: data?.reply || generateLocalFallback(messageText),
        disclaimer: data?.disclaimer || SAFETY_TEXT,
        suggestedActions: data?.suggestedActions || ['Find Paracetamol', 'Search Medicines', 'Nearby Pharmacies'],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      // Safe local fallback on any network/server exception
      const fallbackReply = generateLocalFallback(messageText);
      const botMessage = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        text: fallbackReply,
        disclaimer: SAFETY_TEXT,
        suggestedActions: ['Find Paracetamol', 'Search Medicines', 'Nearby Pharmacies'],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, botMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const generateLocalFallback = (text) => {
    const lower = text.toLowerCase();

    if (
      lower.includes('dose') ||
      lower.includes('dosage') ||
      lower.includes('diagnose') ||
      lower.includes('symptom') ||
      lower.includes('chest pain') ||
      lower.includes('cure')
    ) {
      return 'I cannot provide medical diagnoses, treatment plans, or dosage recommendations. For health concerns and medication dosages, please consult a qualified healthcare professional. I can help you find where specific medicines are in stock near you.';
    }

    if (lower.includes('prescription') || lower.includes('rx')) {
      return "Medicines marked with 'Prescription required' (such as antibiotics and chronic care medications) require a valid doctor's prescription upon pharmacy pickup. Over-the-counter (OTC) products like Paracetamol can be purchased directly without a prescription.";
    }

    if (lower.includes('stock') || lower.includes('pharmacy')) {
      return 'MediFindAI tracks live inventory across verified partner pharmacies. Use our Medicine Search page to check availability (Available, Low Stock, or Out of Stock) and compare prices across nearby pharmacies.';
    }

    if (lower.includes('paracetamol')) {
      return "Paracetamol 500mg (Tablet) is available at partner pharmacies starting from ₹22.50. It is an over-the-counter antipyretic/analgesic. Visit the Search page to compare prices and check real-time stock.";
    }

    if (lower.includes('amoxicillin') || lower.includes('azithromycin')) {
      return "Antibiotics like Amoxicillin and Azithromycin are listed across partner pharmacies with real-time stock levels. Note: These require a valid doctor's prescription for pickup.";
    }

    return "I can help you search for medicines, check live pharmacy stock levels, compare prices, and understand prescription requirements. You can search directly on the Medicine Search page or ask me about any medicine!";
  };

  const handleActionClick = (action) => {
    if (action === 'Search Medicines' || action.startsWith('Search ') || action.startsWith('Find ')) {
      const term = action.replace(/^(Search|Find)\s+/, '');
      if (term && term !== 'Medicines') {
        handleSendMessage(`Find ${term}`);
      } else {
        navigate('/dashboard/search');
        setIsOpen(false);
      }
    } else {
      handleSendMessage(action);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Floating Chat Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          aria-label="Open MediFindAI Assistant"
          className="group relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-tr from-cyan-500 to-primary-600 text-white shadow-2xl transition-all duration-300 hover:scale-110 hover:shadow-glow focus:outline-none focus:ring-4 focus:ring-cyan-400/40"
        >
          {/* Animated subtle ripple ring */}
          <span className="absolute -inset-1 animate-ping rounded-full bg-cyan-400 opacity-25" />
          <FiMessageSquare size={24} className="relative transition-transform group-hover:scale-110" />
          <span className="sr-only">Open MediFindAI Assistant</span>

          {/* Tooltip Badge */}
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="relative inline-flex h-4 w-4 rounded-full bg-cyan-400 ring-2 ring-primary-950 animate-pulse"></span>
          </span>
        </button>
      )}

      {/* Floating Chat Panel */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="MediFindAI Assistant Chat Window"
          className="flex h-[560px] w-[92vw] max-w-[400px] flex-col rounded-4xl border border-white/20 bg-slate-950/95 shadow-2xl backdrop-blur-2xl transition-all duration-200 sm:w-[400px] text-white overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 bg-gradient-to-r from-primary-950 via-primary-900 to-cyan-950 px-5 py-4 text-white">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 to-primary-600 text-white shadow-md shadow-cyan-500/25">
                <span className="text-base font-bold">✚</span>
              </div>
              <div>
                <h2 className="text-sm font-bold leading-tight">MediFindAI Assistant</h2>
                <p className="text-[11px] text-primary-200/80 line-clamp-1 leading-tight">
                  Ask about medicine availability, pharmacies, and using MediFindAI.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsOpen(false)}
                aria-label="Minimize Chat"
                className="rounded-lg p-1.5 text-primary-200/70 transition-colors hover:bg-white/10 hover:text-white"
              >
                <FiMinimize2 size={16} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                aria-label="Close Chat"
                className="rounded-lg p-1.5 text-primary-200/70 transition-colors hover:bg-white/10 hover:text-white"
              >
                <FiX size={18} />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-900/60">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-cyan-500 to-primary-600 text-white rounded-br-none shadow-md'
                      : 'bg-white/10 border border-white/15 text-white rounded-bl-none shadow-md backdrop-blur-md'
                  }`}
                >
                  <p>{msg.text}</p>
                </div>

                {/* Suggested Quick Prompt Chips for Assistant */}
                {msg.role === 'assistant' && msg.suggestedActions && msg.suggestedActions.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5 max-w-[95%]">
                    {msg.suggestedActions.map((action, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleActionClick(action)}
                        className="inline-flex items-center gap-1 rounded-full border border-cyan-400/40 bg-cyan-950/60 px-2.5 py-1 text-xs font-semibold text-cyan-300 shadow-sm backdrop-blur-md transition-colors hover:bg-cyan-900/80 active:scale-95"
                      >
                        <FiCornerDownRight size={11} className="text-cyan-400" />
                        {action}
                      </button>
                    ))}
                  </div>
                )}

                <span className="mt-1 text-[10px] text-primary-200/50 px-1">{msg.timestamp}</span>
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex items-start gap-2">
                <div className="flex items-center gap-1.5 rounded-2xl bg-white/10 border border-white/15 px-4 py-3 shadow-md">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-cyan-400 [animation-delay:-0.3s]"></span>
                  <span className="h-2 w-2 animate-bounce rounded-full bg-cyan-300 [animation-delay:-0.15s]"></span>
                  <span className="h-2 w-2 animate-bounce rounded-full bg-primary-400"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Safety Disclaimer Banner */}
          <div className="border-t border-white/10 bg-white/5 px-4 py-2.5 flex items-start gap-2 text-[11px] text-primary-200/80">
            <FiShield size={13} className="shrink-0 text-cyan-400 mt-0.5" />
            <p className="leading-tight">{SAFETY_TEXT}</p>
          </div>

          {/* Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="border-t border-white/10 bg-slate-950/95 p-3"
          >
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about medicine availability or pharmacies..."
                className="flex-1 rounded-xl border border-white/20 bg-white/10 px-3.5 py-2 text-sm text-white placeholder:text-primary-200/50 focus:border-cyan-400 focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-400/30"
              />
              <button
                type="submit"
                disabled={!input.trim() || isTyping}
                aria-label="Send message"
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 to-primary-600 text-white shadow-md transition-all hover:from-cyan-600 hover:to-primary-700 disabled:opacity-40 disabled:pointer-events-none active:scale-95"
              >
                <FiSend size={15} />
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

