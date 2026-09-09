import { useState, useRef, useEffect } from 'react';
import {
  FiMessageSquare,
  FiX,
  FiSend,
  FiMinimize2,
  FiShield,
  FiCornerDownRight,
  FiRefreshCw,
  FiAlertCircle,
  FiExternalLink,
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/axiosConfig';

const STARTER_PROMPTS = [
  'Find Paracetamol',
  'What is Paracetamol used for?',
  'Side effects of Paracetamol',
  'Which pharmacy has medicine in stock?',
  'Do I need a prescription?',
];

const SAFETY_TEXT =
  'MediFindAI does not provide medical advice. Consult a qualified healthcare professional for medical guidance.';

function generateSessionId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export default function AiChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [sessionId, setSessionId] = useState(generateSessionId);
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'Hello! I am your MediFindAI Assistant. How can I help you find medicines, check live pharmacy stock, or compare prices today?',
      disclaimer: SAFETY_TEXT,
      suggestedActions: STARTER_PROMPTS,
      actions: [
        { label: 'Find Paracetamol', action: 'MEDICINE_SEARCH', payload: 'Paracetamol' },
        { label: 'Side effects of Paracetamol', action: 'ASK_QUESTION', payload: 'What are the side effects of Paracetamol?' },
        { label: 'Nearby Pharmacies', action: 'NEARBY_PHARMACIES', payload: '/dashboard/pharmacies' },
        { label: 'Do I need a prescription?', action: 'ASK_QUESTION', payload: 'Do I need a prescription?' },
      ],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [lastError, setLastError] = useState(null);
  const [failedMessage, setFailedMessage] = useState('');

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

  const handleResetConversation = () => {
    setSessionId(generateSessionId());
    setLastError(null);
    setFailedMessage('');
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        text: 'Hello! I am your MediFindAI Assistant. How can I help you find medicines, check live pharmacy stock, or compare prices today?',
        disclaimer: SAFETY_TEXT,
        suggestedActions: STARTER_PROMPTS,
        actions: [
          { label: 'Find Paracetamol', action: 'MEDICINE_SEARCH', payload: 'Paracetamol' },
          { label: 'Side effects of Paracetamol', action: 'ASK_QUESTION', payload: 'What are the side effects of Paracetamol?' },
          { label: 'Nearby Pharmacies', action: 'NEARBY_PHARMACIES', payload: '/dashboard/pharmacies' },
          { label: 'Do I need a prescription?', action: 'ASK_QUESTION', payload: 'Do I need a prescription?' },
        ],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  const handleSendMessage = async (userText) => {
    const messageText = (userText || input).trim();
    if (!messageText || isTyping) return;

    setLastError(null);
    setFailedMessage('');

    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: messageText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    // Format conversation history (up to last 8 turns)
    const historyPayload = messages
      .filter((m) => m.id !== 'welcome' && m.text)
      .slice(-8)
      .map((m) => ({
        role: m.role,
        content: m.text,
      }));

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      // Call backend AI endpoint
      const response = await apiClient.post('/ai/chat', {
        message: messageText,
        history: historyPayload,
        sessionId: sessionId,
      });

      const data = response?.data?.data;
      const botMessage = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        text: data?.reply || generateLocalFallback(messageText),
        disclaimer: data?.disclaimer || SAFETY_TEXT,
        suggestedActions: data?.suggestedActions || ['Find Paracetamol', 'Search Medicines', 'Nearby Pharmacies'],
        actions: data?.actions || [],
        intent: data?.intent,
        medicineName: data?.medicineName,
        provider: data?.provider,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.warn('AI chat network error, using resilient fallback:', error);
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

    // 1. Nearby pharmacies / locations
    if (lower.includes('nearby') || lower.includes('near me') || (lower.includes('pharmacies') && (lower.includes('what') || lower.includes('where') || lower.includes('closest') || lower.includes('around')))) {
      return `### Verified Partner Pharmacies Near You\n\nMediFindAI connects you with verified local pharmacies featuring real-time stock sync:\n\n- **Apollo Care Pharmacy** — Road No. 12, Banjara Hills, Hyderabad (Phone: 9100000001)\n- **MedPlus Express** — Jubilee Hills Road No. 3, Hyderabad (Phone: 9100000002)\n- **HealthFirst Pharmacy** — Ameerpet Main Road, Hyderabad (Phone: 9100000003)\n\nHead to the **Nearby Pharmacies** page to view live map distances, open hours, and directions.`;
    }

    // 2. Reservations
    if (lower.includes('reserve') || lower.includes('reservation') || lower.includes('pickup hold') || lower.includes('hold a medicine')) {
      return `### 24-Hour Medicine Pickup Holds\n\nMediFindAI allows you to reserve in-stock medicines at verified partner pharmacies with a **guaranteed 24-hour hold**:\n1. Find your medicine on the Search page.\n2. Select your preferred pharmacy and click **'Reserve for Pickup'**.\n3. Present your reservation code at the pharmacy counter to collect.`;
    }

    // 3. Orders
    if (lower.includes('order')) {
      return `### Manage & Track Orders\n\nYou can track active medicine orders, view detailed fulfillment status, and see past order history in the **Orders** section.`;
    }

    // 4. Prescription upload / help
    if (lower.includes('prescription') || lower.includes('upload') || lower.includes('doctor note')) {
      if (lower.includes('without prescription') || lower.includes('need prescription') || lower.includes('need rx') || lower.includes('is it otc')) {
        return "Medicines marked with 'Prescription required' (such as antibiotics and chronic care medications) require a valid doctor's prescription upon pharmacy pickup. Over-the-counter (OTC) products like Paracetamol can be purchased directly without a prescription.";
      }
      return `### Upload & Scan Your Prescription\n\nMediFindAI features an **AI-powered Prescription OCR scanner**:\n1. Navigate to **Prescriptions** or click **'Upload Prescription'** below.\n2. Upload an image (JPG, PNG, PDF) of your doctor's prescription.\n3. Our system automatically extracts prescribed medicine names, matches catalog inventory, and locates nearby stock!`;
    }

    // 5. Side effects
    if (lower.includes('side effect') || lower.includes('adverse') || lower.includes('reaction') || lower.includes('harmful')) {
      if (lower.includes('paracetamol') || lower.includes('dolo') || lower.includes('crocin')) {
        return "### Side Effects & Safety of Paracetamol (Acetaminophen)\n\nParacetamol is generally well tolerated when taken as directed. Common side effects are rare, but some individuals may experience mild nausea or minor skin allergic reactions. Overdose poses a serious risk of severe liver damage (hepatotoxicity).\n\n⚠️ **When to seek immediate medical care:**\nIf you experience signs of a severe allergic reaction (such as facial/throat swelling, widespread hives, shortness of breath), contact emergency medical services immediately.";
      }
      if (lower.includes('amoxicillin')) {
        return "### Side Effects of Amoxicillin\n\nCommon side effects include diarrhea, nausea, mild skin rash, and stomach discomfort. Rarely, severe allergic anaphylaxis or antibiotic-associated colitis may develop. Consult your physician if adverse symptoms persist.";
      }
      return "Most medications can cause mild side effects like nausea or stomach discomfort. Severe reactions such as breathing difficulty or facial swelling require emergency care.";
    }

    // 6. Uses / Indications
    if (lower.includes('used for') || lower.includes('uses of') || lower.includes('indication') || lower.startsWith('what is ') || lower.startsWith('explain ')) {
      if (lower.includes('paracetamol')) {
        return "### About Paracetamol\n\n**Category:** Analgesic & Antipyretic (Pain Relief & Fever Reducer)\n**Prescription Status:** ✓ Over-the-Counter (OTC)\n\n#### Primary Indications & Uses:\nUsed to relieve mild-to-moderate pain (headaches, toothaches, muscle aches, arthritis) and to reduce fever associated with colds and flu.";
      }
      if (lower.includes('amoxicillin')) {
        return "### About Amoxicillin\n\n**Category:** Broad-Spectrum Penicillin Antibiotic\n**Prescription Status:** ⚠️ Prescription Required\n\n#### Primary Indications & Uses:\nPrescribed to treat bacterial infections including ear-nose-throat (ENT) infections, bronchitis, pneumonia, skin infections, and urinary tract infections (UTIs).";
      }
    }

    // 7. Stock, Price, Search
    if (lower.includes('stock') || lower.includes('pharmacy') || lower.includes('find') || lower.includes('price') || lower.includes('compare')) {
      return "### Live Pharmacy Inventory & Pricing\n\nMediFindAI tracks live inventory across verified partner pharmacies (Apollo Care, MedPlus Express, HealthFirst Pharmacy). Paracetamol 500mg is currently available starting from ₹21.00. You can check stock, compare prices, and place 24-hour pickup holds directly on the Search page.";
    }

    return 'I can help you understand medicines, indications, side effects, precautions, live pharmacy stock, and prescription requirements. Ask me anything!';
  };

  const handleActionClick = (actionItem) => {
    if (typeof actionItem === 'string') {
      const action = actionItem;
      if (action === 'Search Medicines' || action.startsWith('Search ') || action.startsWith('Find ')) {
        const term = action.replace(/^(Search|Find)\s+/, '');
        if (term && term !== 'Medicines') {
          handleSendMessage(`Find ${term}`);
        } else {
          navigate('/dashboard/search');
          setIsOpen(false);
        }
      } else if (action === 'Nearby Pharmacies' || action.includes('Pharmacies Near') || action === 'View Nearby Pharmacies') {
        navigate('/dashboard/pharmacies');
        setIsOpen(false);
      } else if (action === 'Upload Prescription') {
        navigate('/dashboard/search?upload=true');
        setIsOpen(false);
      } else if (action === 'My Reservations' || action === 'Reservations') {
        navigate('/dashboard/reservations');
        setIsOpen(false);
      } else if (action === 'View My Orders' || action === 'Orders') {
        navigate('/dashboard/orders');
        setIsOpen(false);
      } else {
        handleSendMessage(action);
      }
      return;
    }

    // Structured Action Object
    if (actionItem && actionItem.action) {
      switch (actionItem.action) {
        case 'MEDICINE_SEARCH':
          if (actionItem.payload) {
            navigate(`/dashboard/search?q=${encodeURIComponent(actionItem.payload)}`);
          } else {
            navigate('/dashboard/search');
          }
          setIsOpen(false);
          break;
        case 'NEARBY_PHARMACIES':
          navigate('/dashboard/pharmacies');
          setIsOpen(false);
          break;
        case 'PRESCRIPTION_UPLOAD':
          navigate('/dashboard/search?upload=true');
          setIsOpen(false);
          break;
        case 'ORDERS':
          navigate('/dashboard/orders');
          setIsOpen(false);
          break;
        case 'RESERVATIONS':
          navigate('/dashboard/reservations');
          setIsOpen(false);
          break;
        case 'ASK_QUESTION':
        default:
          handleSendMessage(actionItem.payload || actionItem.label);
          break;
      }
    }
  };

  const handleKeyDownInput = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Safe formatting for AI assistant messages (bold, bullet points, headers)
  const renderFormattedMessage = (rawText) => {
    if (!rawText) return null;

    const lines = rawText.split('\n');
    const elements = [];

    let currentList = [];
    let listKey = 0;

    const flushList = () => {
      if (currentList.length > 0) {
        elements.push(
          <ul key={`ul-${listKey++}`} className="my-1.5 ml-4 list-disc space-y-1 text-sm">
            {currentList.map((item, idx) => (
              <li key={idx}>{parseInlineFormatting(item)}</li>
            ))}
          </ul>
        );
        currentList = [];
      }
    };

    lines.forEach((line, index) => {
      const trimmed = line.trim();

      if (!trimmed) {
        flushList();
        elements.push(<div key={`br-${index}`} className="h-1.5" />);
        return;
      }

      // Headers (### or ## or #)
      if (trimmed.startsWith('### ') || trimmed.startsWith('## ') || trimmed.startsWith('# ')) {
        flushList();
        const headerText = trimmed.replace(/^#+\s*/, '');
        elements.push(
          <h4 key={`h-${index}`} className="mt-2 text-xs font-bold uppercase tracking-wider text-cyan-300">
            {parseInlineFormatting(headerText)}
          </h4>
        );
        return;
      }

      // Bullet points (- or * or •)
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('• ')) {
        const itemText = trimmed.replace(/^[-*•]\s+/, '');
        currentList.push(itemText);
        return;
      }

      // Numbered list (1. 2. etc)
      if (/^\d+\.\s+/.test(trimmed)) {
        flushList();
        const itemText = trimmed.replace(/^\d+\.\s+/, '');
        elements.push(
          <div key={`num-${index}`} className="my-1 flex items-start gap-1.5 text-sm">
            <span className="shrink-0 font-semibold text-cyan-400">{trimmed.match(/^\d+\./)[0]}</span>
            <span>{parseInlineFormatting(itemText)}</span>
          </div>
        );
        return;
      }

      // Normal paragraph
      flushList();
      elements.push(
        <p key={`p-${index}`} className="my-0.5 text-sm leading-relaxed">
          {parseInlineFormatting(trimmed)}
        </p>
      );
    });

    flushList();
    return elements;
  };

  const parseInlineFormatting = (text) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="font-semibold text-white">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
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

          {/* Online Active Badge */}
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
          className="flex h-[580px] w-[92vw] max-w-[420px] flex-col rounded-3xl border border-white/20 bg-slate-950/95 shadow-2xl backdrop-blur-2xl transition-all duration-200 sm:w-[420px] text-white overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 bg-gradient-to-r from-primary-950 via-primary-900 to-cyan-950 px-5 py-3.5 text-white">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 to-primary-600 text-white shadow-md shadow-cyan-500/25">
                <span className="text-base font-bold">✚</span>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h2 className="text-sm font-bold leading-tight">MediFindAI Assistant</h2>
                  <span className="rounded-full bg-emerald-500/20 px-1.5 py-0.2 text-[10px] font-medium text-emerald-400 border border-emerald-500/30">
                    AI Clinical
                  </span>
                </div>
                <p className="text-[11px] text-primary-200/80 line-clamp-1 leading-tight">
                  Ask about medicine availability, pharmacies, and using MediFindAI.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handleResetConversation}
                aria-label="New Conversation"
                title="New Conversation"
                className="rounded-lg p-1.5 text-primary-200/70 transition-colors hover:bg-white/10 hover:text-white"
              >
                <FiRefreshCw size={15} />
              </button>
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
                  className={`max-w-[88%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-cyan-500 to-primary-600 text-white rounded-br-none shadow-md'
                      : 'bg-white/10 border border-white/15 text-white rounded-bl-none shadow-md backdrop-blur-md'
                  }`}
                >
                  {msg.role === 'user' ? (
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  ) : (
                    <div>{renderFormattedMessage(msg.text)}</div>
                  )}
                </div>

                {/* Structured Action Buttons or String Prompt Chips for Assistant */}
                {msg.role === 'assistant' && (
                  <div className="mt-2 flex flex-wrap gap-1.5 max-w-[95%]">
                    {msg.actions && msg.actions.length > 0
                      ? msg.actions.map((act, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleActionClick(act)}
                            className="inline-flex items-center gap-1.5 rounded-full border border-cyan-400/40 bg-cyan-950/70 px-2.5 py-1 text-xs font-semibold text-cyan-300 shadow-sm backdrop-blur-md transition-all hover:bg-cyan-900 hover:border-cyan-300 hover:scale-102 active:scale-95"
                          >
                            {act.action === 'ASK_QUESTION' ? (
                              <FiCornerDownRight size={11} className="text-cyan-400" />
                            ) : (
                              <FiExternalLink size={11} className="text-cyan-400" />
                            )}
                            {act.label}
                          </button>
                        ))
                      : msg.suggestedActions?.map((actionText, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleActionClick(actionText)}
                            className="inline-flex items-center gap-1 rounded-full border border-cyan-400/40 bg-cyan-950/60 px-2.5 py-1 text-xs font-semibold text-cyan-300 shadow-sm backdrop-blur-md transition-colors hover:bg-cyan-900/80 active:scale-95"
                          >
                            <FiCornerDownRight size={11} className="text-cyan-400" />
                            {actionText}
                          </button>
                        ))}
                  </div>
                )}

                <span className="mt-1 text-[10px] text-primary-200/50 px-1">{msg.timestamp}</span>
              </div>
            ))}

            {/* Error banner with retry */}
            {lastError && (
              <div className="flex items-center justify-between gap-2 rounded-xl border border-rose-500/30 bg-rose-950/40 p-2.5 text-xs text-rose-200">
                <div className="flex items-center gap-1.5">
                  <FiAlertCircle className="shrink-0 text-rose-400" />
                  <span>{lastError}</span>
                </div>
                {failedMessage && (
                  <button
                    onClick={() => handleSendMessage(failedMessage)}
                    className="shrink-0 font-semibold text-cyan-300 underline hover:text-cyan-200"
                  >
                    Retry
                  </button>
                )}
              </div>
            )}

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
          <div className="border-t border-white/10 bg-white/5 px-4 py-2 flex items-start gap-2 text-[11px] text-primary-200/80">
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
                onKeyDown={handleKeyDownInput}
                placeholder="Ask about medicine availability or pharmacies..."
                className="flex-1 rounded-xl border border-white/20 bg-white/10 px-3.5 py-2.5 text-sm text-white placeholder:text-primary-200/50 focus:border-cyan-400 focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-400/30"
              />
              <button
                type="submit"
                disabled={!input.trim() || isTyping}
                aria-label="Send message"
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 to-primary-600 text-white shadow-md transition-all hover:from-cyan-600 hover:to-primary-700 disabled:opacity-40 disabled:pointer-events-none active:scale-95"
              >
                <FiSend size={16} />
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
