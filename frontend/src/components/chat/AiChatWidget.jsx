import { useState, useRef, useEffect, useContext } from 'react';
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
  FiMapPin,
  FiPhone,
  FiClock,
  FiPackage,
  FiCheckCircle,
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { ReactReduxContext } from 'react-redux';
import apiClient from '../../api/axiosConfig';

/**
 * Approved React Router destination map.
 * Central authority on application routes, descriptive names, and authentication requirements.
 */
export const VALID_ROUTES = {
  '/dashboard/search': { name: 'Medicine Search', requiresAuth: false, fallbackPublic: '/medicines' },
  '/medicines': { name: 'Medicine Search', requiresAuth: false },
  '/dashboard/pharmacies': { name: 'Nearby Pharmacies', requiresAuth: false, fallbackPublic: '/pharmacies' },
  '/pharmacies': { name: 'Nearby Pharmacies', requiresAuth: false },
  '/dashboard/reservations': { name: 'My Reservations', requiresAuth: true },
  '/reservations': { name: 'My Reservations', requiresAuth: true },
  '/dashboard/orders': { name: 'My Orders', requiresAuth: true },
  '/orders': { name: 'My Orders', requiresAuth: true },
  '/dashboard/search?upload=true': { name: 'Prescription Upload', requiresAuth: false },
  '/cart': { name: 'Cart', requiresAuth: false },
  '/checkout': { name: 'Checkout', requiresAuth: true },
  '/dashboard': { name: 'Dashboard', requiresAuth: true },
  '/login': { name: 'Login', requiresAuth: false },
  '/register': { name: 'Register', requiresAuth: false },
};

const STARTER_PROMPTS = [
  'Find Paracetamol',
  'What is Paracetamol used for?',
  'Nearby Pharmacies',
  'How do I reserve a medicine?',
  'Upload Prescription',
];

const SAFETY_TEXT =
  'MediFindAI does not provide medical advice. Consult a qualified healthcare professional for medical guidance.';

function generateSessionId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Safely accesses auth state without crashing in isolated component test environments.
 */
function useSafeAuth() {
  const reduxContext = useContext(ReactReduxContext);
  const [auth, setAuth] = useState(() => ({
    isAuthenticated: Boolean(reduxContext?.store?.getState()?.auth?.isAuthenticated),
    user: reduxContext?.store?.getState()?.auth?.user || null,
  }));

  useEffect(() => {
    if (!reduxContext?.store) return;
    const unsubscribe = reduxContext.store.subscribe(() => {
      const state = reduxContext.store.getState();
      setAuth({
        isAuthenticated: Boolean(state?.auth?.isAuthenticated),
        user: state?.auth?.user || null,
      });
    });
    return unsubscribe;
  }, [reduxContext]);

  return auth;
}

export default function AiChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [sessionId, setSessionId] = useState(generateSessionId);
  const { isAuthenticated, user } = useSafeAuth();

  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'Hello! I am your **MediFindAI Healthcare Assistant**.\n\nAsk me about medicine uses, side effects, live pharmacy stock, or managing your orders and reservations.',
      disclaimer: SAFETY_TEXT,
      suggestedActions: STARTER_PROMPTS,
      actions: [
        { label: 'Find Paracetamol', action: 'ASK_QUESTION', payload: 'Find Paracetamol' },
        { label: 'What is Paracetamol used for?', action: 'ASK_QUESTION', payload: 'What is Paracetamol used for?' },
        { label: 'Nearby Pharmacies', action: 'ASK_QUESTION', payload: 'What are nearby pharmacies?' },
        { label: 'How to reserve?', action: 'ASK_QUESTION', payload: 'How do I reserve a medicine?' },
        { label: 'Upload Prescription', action: 'ASK_QUESTION', payload: 'How do I upload a prescription?' },
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
        text: 'Hello! I am your **MediFindAI Healthcare Assistant**.\n\nAsk me about medicine uses, side effects, live pharmacy stock, or managing your orders and reservations.',
        disclaimer: SAFETY_TEXT,
        suggestedActions: STARTER_PROMPTS,
        actions: [
          { label: 'Find Paracetamol', action: 'ASK_QUESTION', payload: 'Find Paracetamol' },
          { label: 'What is Paracetamol used for?', action: 'ASK_QUESTION', payload: 'What is Paracetamol used for?' },
          { label: 'Nearby Pharmacies', action: 'ASK_QUESTION', payload: 'What are nearby pharmacies?' },
          { label: 'How to reserve?', action: 'ASK_QUESTION', payload: 'How do I reserve a medicine?' },
          { label: 'Upload Prescription', action: 'ASK_QUESTION', payload: 'How do I upload a prescription?' },
        ],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  /**
   * Central, maintainable navigation handler.
   * Validates target route against React Router configuration and enforces auth requirements safely.
   */
  const handleExecuteNavigation = (targetRoute, requiresAuth = false, destinationName = '') => {
    if (!targetRoute) return false;

    const cleanRoute = targetRoute.trim();
    const [pathPart, queryPart] = cleanRoute.split('?');
    const matchedConfig = VALID_ROUTES[cleanRoute] || VALID_ROUTES[pathPart];

    if (!matchedConfig) {
      console.warn(`[Navigation] Destination not recognized in approved routes: ${targetRoute}`);
      return false;
    }

    const authNeeded = requiresAuth || matchedConfig.requiresAuth;

    if (authNeeded && !isAuthenticated) {
      setMessages((prev) => [
        ...prev,
        {
          id: `auth-needed-${Date.now()}`,
          role: 'assistant',
          text: `⚠️ **Authentication Required**\n\nTo access **${destinationName || matchedConfig.name}**, please sign in to your MediFindAI account.`,
          actions: [
            { label: 'Go to Login', action: 'NAVIGATE', payload: '/login' },
            { label: 'Create an Account', action: 'NAVIGATE', payload: '/register' },
          ],
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      return false;
    }

    navigate(cleanRoute);
    return true;
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
        suggestedActions: data?.suggestedQuestions || data?.suggestedActions || ['Find Paracetamol', 'Nearby Pharmacies', 'How to reserve?'],
        actions: data?.actions || [],
        pharmacyCards: data?.pharmacyCards || [],
        medicineSummaries: data?.medicineSummaries || [],
        reservations: data?.reservations || [],
        orders: data?.orders || [],
        intent: data?.intent,
        medicineName: data?.medicineName,
        provider: data?.provider,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMessage]);

      // If this was an explicit navigation intent, execute navigation after posting the answer
      if (data?.intent === 'APP_NAVIGATION' && data?.navigation?.targetRoute) {
        handleExecuteNavigation(
          data.navigation.targetRoute,
          data.navigation.requiresAuth,
          data.navigation.destinationName
        );
      }
    } catch (error) {
      console.warn('AI chat error, using local clinical fallback:', error);
      const fallbackReply = generateLocalFallback(messageText);

      // Check if message was an explicit navigation directive
      const explicitNavTarget = resolveLocalNavigation(messageText);

      const botMessage = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        text: fallbackReply,
        disclaimer: SAFETY_TEXT,
        suggestedActions: ['Find Paracetamol', 'Nearby Pharmacies', 'How to reserve a medicine?'],
        actions: explicitNavTarget
          ? [{ label: `Open ${explicitNavTarget.name}`, action: 'NAVIGATE', payload: explicitNavTarget.route, requiresAuth: explicitNavTarget.requiresAuth }]
          : [
              { label: 'Find Paracetamol', action: 'ASK_QUESTION', payload: 'Find Paracetamol' },
              { label: 'Open Medicine Search', action: 'NAVIGATE', payload: '/dashboard/search' },
            ],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMessage]);

      if (explicitNavTarget) {
        handleExecuteNavigation(explicitNavTarget.route, explicitNavTarget.requiresAuth, explicitNavTarget.name);
      }
    } finally {
      setIsTyping(false);
    }
  };

  /**
   * Dispatches button clicks based on intent.
   * Suggested questions are submitted as chat queries.
   * Explicit navigation buttons trigger handleExecuteNavigation.
   */
  const handleActionClick = (actionItem) => {
    if (!actionItem) return;

    // String action chip (from suggested questions / prompts)
    if (typeof actionItem === 'string') {
      const lower = actionItem.trim().toLowerCase();

      // Only direct navigation verbs trigger navigation
      const isExplicitNav =
        lower.startsWith('open ') ||
        lower.startsWith('go to ') ||
        lower.startsWith('take me to ') ||
        lower.startsWith('navigate to ') ||
        lower.startsWith('visit ');

      if (isExplicitNav) {
        handleSendMessage(actionItem);
        return;
      }

      // Suggestions like "Find Paracetamol", "Nearby Pharmacies", "Upload Prescription" are questions!
      handleSendMessage(actionItem);
      return;
    }

    // Structured Action Object { label, action, payload, requiresAuth }
    if (actionItem.action === 'NAVIGATE') {
      handleExecuteNavigation(actionItem.payload, actionItem.requiresAuth, actionItem.label);
      return;
    }

    // Default: submit as conversational message
    const questionText = actionItem.payload || actionItem.label;
    handleSendMessage(questionText);
  };

  const resolveLocalNavigation = (text) => {
    const lower = text.toLowerCase().trim();
    const isNavDirective =
      lower.startsWith('open ') ||
      lower.startsWith('go to ') ||
      lower.startsWith('take me to ') ||
      lower.startsWith('navigate to ') ||
      lower.startsWith('visit ');

    if (!isNavDirective) return null;

    if (lower.contains('search') || lower.contains('medicine') || lower.contains('catalog')) {
      return { route: '/dashboard/search', name: 'Medicine Search', requiresAuth: false };
    }
    if (lower.contains('pharmacy') || lower.contains('pharmacies') || lower.contains('nearby')) {
      return { route: '/dashboard/pharmacies', name: 'Nearby Pharmacies', requiresAuth: false };
    }
    if (lower.contains('reservation') || lower.contains('hold')) {
      return { route: '/dashboard/reservations', name: 'My Reservations', requiresAuth: true };
    }
    if (lower.contains('order')) {
      return { route: '/dashboard/orders', name: 'My Orders', requiresAuth: true };
    }
    if (lower.contains('upload') || lower.contains('prescription')) {
      return { route: '/dashboard/search?upload=true', name: 'Prescription Upload', requiresAuth: false };
    }
    return null;
  };

  const generateLocalFallback = (text) => {
    const lower = text.toLowerCase();

    // 1. Explicit navigation confirmations
    const nav = resolveLocalNavigation(text);
    if (nav) {
      return `Navigating to **${nav.name}**...`;
    }

    // 2. Ambiguous query clarification
    const cleaned = lower.replace(/[?.!,;:]+$/, '').trim();
    if (['medicine', 'medicines', 'pharmacy', 'pharmacies', 'help', 'check', 'status', 'info'].includes(cleaned)) {
      return `Could you please specify what you would like to know?\n\n- **Medicine Uses & Indications** (e.g. *'What is Paracetamol used for?'*)\n- **Side Effects** (e.g. *'Side effects of Amoxicillin'*)\n- **Pharmacy Stock & Prices** (e.g. *'Which pharmacies have Paracetamol in stock?'*)\n- **Local Pharmacies** (e.g. *'Find pharmacies near Hyderabad'*)\n- **Reservations & Orders** (e.g. *'How do I reserve a medicine?'* or *'What is the status of my order?'*)\n- **Direct Navigation** (e.g. *'Open medicine search'* or *'Go to my orders'*)`;
    }

    // 3. Side effects
    if (lower.includes('side effect') || lower.includes('adverse') || lower.includes('reaction')) {
      if (lower.includes('paracetamol') || lower.includes('acetaminophen')) {
        return `### Side Effects & Safety of Paracetamol (Acetaminophen)\n\nParacetamol is generally well tolerated when taken as directed. Common side effects are rare, but some individuals may experience mild nausea or minor skin allergic reactions. Overdose poses a serious risk of severe liver damage (hepatotoxicity).\n\n⚠️ **When to seek immediate medical care:**\nIf you experience signs of a severe allergic reaction (such as facial/throat swelling, widespread hives, shortness of breath), contact emergency medical services immediately.`;
      }
      if (lower.includes('amoxicillin')) {
        return `### Side Effects of Amoxicillin\n\nCommon side effects include diarrhea, mild nausea, skin rash, and stomach discomfort. Rarely, severe allergic anaphylaxis or antibiotic-associated colitis may develop. Consult your physician if adverse symptoms persist.`;
      }
      return `Most medications can cause mild side effects like nausea or stomach discomfort. Severe reactions such as breathing difficulty or facial swelling require emergency medical care.`;
    }

    // 4. Indications / Uses
    if (lower.includes('used for') || lower.includes('uses of') || lower.startsWith('what is ') || lower.startsWith('explain ')) {
      if (lower.includes('paracetamol')) {
        return `### About Paracetamol (Acetaminophen)\n\n**Category:** Analgesic & Antipyretic (Pain Relief & Fever Reducer)\n**Prescription Status:** ✓ Over-the-Counter (OTC)\n\n#### Primary Indications & Uses:\nUsed to relieve mild-to-moderate pain (headaches, toothaches, muscle aches, arthritis) and to reduce fever associated with colds and flu.`;
      }
      if (lower.includes('amoxicillin')) {
        return `### About Amoxicillin\n\n**Category:** Broad-Spectrum Penicillin Antibiotic\n**Prescription Status:** ⚠️ Prescription Required\n\n#### Primary Indications & Uses:\nPrescribed to treat bacterial infections including ear-nose-throat (ENT) infections, bronchitis, pneumonia, skin infections, and urinary tract infections (UTIs).`;
      }
    }

    // 5. Prescription questions
    if (lower.includes('prescription') || lower.includes('upload')) {
      if (lower.includes('without prescription') || lower.includes('need prescription') || lower.includes('is it otc')) {
        return `Medicines classified as antibiotics, cardiovascular agents, or schedule drugs require a valid doctor's prescription. Over-the-counter pain relievers (like Paracetamol) can be purchased directly without a prescription at all partner pharmacies.`;
      }
      return `### How to Upload & Scan Your Prescription\n\nMediFindAI features an **intelligent AI Prescription Scanner (OCR)**:\n\n1. Click **'Open Prescription Upload'** below or visit the Medicine Search page.\n2. Click **'Upload Prescription & Extract Medicines'** and select an image (JPG, PNG, or PDF) of your prescription.\n3. Our AI automatically extracts prescribed medicines, matches them against local inventory, and locates nearby stock!\n\nYou can then reserve all matching medicines in a single click.`;
    }

    // 6. Reservations
    if (lower.includes('reserve') || lower.includes('reservation') || lower.includes('pickup hold')) {
      return `### 24-Hour Guaranteed Medicine Pickup Holds\n\nMediFindAI allows you to reserve in-stock medicines at verified partner pharmacies with a **guaranteed 24-hour hold**:\n\n1. **Search** for your prescribed or OTC medicine.\n2. **Select** your preferred pharmacy with verified live stock.\n3. Click **'Reserve for Pickup'** to generate your secure reservation code.\n4. **Visit the pharmacy counter** within 24 hours, show your code, and collect your medicine with no price surges.`;
    }

    // 7. Orders
    if (lower.includes('order')) {
      return `### Track & Manage Your Orders\n\nYou can track active medicine orders, view detailed fulfillment status, and see past order invoices in the **Orders** section.`;
    }

    // 8. Pharmacies / Nearby
    if (lower.includes('nearby') || lower.includes('pharmacies') || lower.includes('pharmacy')) {
      return `### Verified Partner Pharmacies Near You\n\nMediFindAI connects you with verified local pharmacies featuring real-time stock sync:\n\n- **Apollo Care Pharmacy** — Road No. 12, Banjara Hills, Hyderabad (Phone: 9100000001)\n- **MedPlus Express** — Jubilee Hills Road No. 3, Hyderabad (Phone: 9100000002)\n- **HealthFirst Pharmacy** — Ameerpet Main Road, Hyderabad (Phone: 9100000003)\n\nAsk for stock availability for specific medicines to check prices and quantities.`;
    }

    // 9. Medicine stock & price
    if (lower.includes('paracetamol') || lower.includes('price') || lower.includes('stock')) {
      return `### Live Inventory & Pricing for Paracetamol 500mg\n\nParacetamol 500mg is currently available starting from **₹22.50** across verified partner pharmacies with live inventory sync.`;
    }

    return `Hello! I am your **MediFindAI Healthcare Assistant**. I can help you with medicine indications, side effects, live stock, and finding nearby pharmacies. What would you like to know?`;
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
          <ul key={`ul-${listKey++}`} className="my-1.5 ml-4 list-disc space-y-1 text-sm text-slate-200">
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
        <p key={`p-${index}`} className="my-0.5 text-sm leading-relaxed text-slate-100">
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
          <span className="absolute -inset-1 animate-ping rounded-full bg-cyan-400 opacity-25" />
          <FiMessageSquare size={24} className="relative transition-transform group-hover:scale-110" />
          <span className="sr-only">Open MediFindAI Assistant</span>

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
          className="flex h-[600px] w-[94vw] max-w-[430px] flex-col rounded-3xl border border-white/20 bg-slate-950/95 shadow-2xl backdrop-blur-2xl transition-all duration-200 sm:w-[430px] text-white overflow-hidden"
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
                  Ask questions or request medicine availability.
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
                  className={`max-w-[90%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-cyan-500 to-primary-600 text-white rounded-br-none shadow-md'
                      : 'bg-white/10 border border-white/15 text-white rounded-bl-none shadow-md backdrop-blur-md'
                  }`}
                >
                  {msg.role === 'user' ? (
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  ) : (
                    <div>
                      {renderFormattedMessage(msg.text)}

                      {/* Rich Medicine Summaries */}
                      {msg.medicineSummaries && msg.medicineSummaries.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {msg.medicineSummaries.map((med, idx) => (
                            <div key={idx} className="rounded-xl border border-cyan-500/30 bg-slate-950/80 p-2.5 text-xs">
                              <div className="flex items-start justify-between gap-1">
                                <div>
                                  <h4 className="font-bold text-cyan-300">{med.name}</h4>
                                  {med.genericName && (
                                    <p className="text-[11px] text-slate-300 italic">Generic: {med.genericName}</p>
                                  )}
                                </div>
                                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-semibold ${
                                  med.prescriptionRequired
                                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                }`}>
                                  {med.prescriptionRequired ? 'Rx Required' : 'OTC Available'}
                                </span>
                              </div>
                              <div className="mt-1.5 flex flex-wrap gap-1.5 text-[10px] text-slate-300">
                                <span className="rounded bg-white/10 px-1.5 py-0.5">{med.dosageForm || 'Tablet'}</span>
                                {med.strength && <span className="rounded bg-white/10 px-1.5 py-0.5">{med.strength}</span>}
                                {med.category && <span className="rounded bg-white/10 px-1.5 py-0.5">{med.category}</span>}
                              </div>
                              {med.minPrice > 0 && (
                                <p className="mt-1.5 text-[11px] font-medium text-cyan-200">
                                  Available from <span className="font-bold text-white">₹{Number(med.minPrice).toFixed(2)}</span>
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Rich Pharmacy Result Cards */}
                      {msg.pharmacyCards && msg.pharmacyCards.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {msg.pharmacyCards.map((pharm, idx) => (
                            <div key={idx} className="rounded-xl border border-white/15 bg-slate-950/85 p-2.5 text-xs hover:border-cyan-400/40 transition-colors">
                              <div className="flex items-start justify-between gap-1">
                                <h4 className="font-bold text-white flex items-center gap-1.5">
                                  <FiMapPin className="text-cyan-400 shrink-0" size={12} />
                                  {pharm.name}
                                </h4>
                                {pharm.inStock && (
                                  <span className="shrink-0 rounded-full bg-emerald-500/20 px-1.5 py-0.2 text-[9px] font-semibold text-emerald-400 border border-emerald-500/30">
                                    Stock: {pharm.stockQuantity}
                                  </span>
                                )}
                              </div>
                              {(pharm.address || pharm.city) && (
                                <p className="mt-1 text-[11px] text-slate-400 pl-4">
                                  {[pharm.address, pharm.city].filter(Boolean).join(', ')}
                                </p>
                              )}
                              <div className="mt-2 flex items-center justify-between text-[11px] pt-1.5 border-t border-white/10">
                                {pharm.phone ? (
                                  <span className="text-slate-300 flex items-center gap-1">
                                    <FiPhone size={10} className="text-cyan-400" />
                                    {pharm.phone}
                                  </span>
                                ) : <span />}
                                {pharm.price > 0 && (
                                  <span className="font-bold text-cyan-300">
                                    ₹{Number(pharm.price).toFixed(2)}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Rich User Reservation Summaries */}
                      {msg.reservations && msg.reservations.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {msg.reservations.map((res, idx) => (
                            <div key={idx} className="rounded-xl border border-cyan-500/30 bg-slate-950/85 p-2.5 text-xs">
                              <div className="flex items-center justify-between gap-1">
                                <span className="font-mono text-[11px] font-bold text-cyan-400 bg-cyan-950/80 px-1.5 py-0.5 rounded border border-cyan-500/30">
                                  {res.reservationCode}
                                </span>
                                <span className="rounded-full bg-emerald-500/20 px-1.5 py-0.2 text-[9px] font-semibold text-emerald-300 border border-emerald-500/30">
                                  {res.status}
                                </span>
                              </div>
                              <p className="mt-1 font-bold text-white">{res.medicineName}</p>
                              <p className="text-[11px] text-slate-400">{res.pharmacyName}</p>
                              <div className="mt-1.5 flex items-center justify-between text-[11px] pt-1 border-t border-white/10">
                                <span className="text-slate-300">Qty: {res.quantity} • ₹{Number(res.totalPrice).toFixed(2)}</span>
                                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                  <FiClock size={10} className="text-cyan-400" />
                                  {res.expiresAt}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Rich User Order Summaries */}
                      {msg.orders && msg.orders.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {msg.orders.map((ord, idx) => (
                            <div key={idx} className="rounded-xl border border-white/15 bg-slate-950/85 p-2.5 text-xs">
                              <div className="flex items-center justify-between gap-1">
                                <span className="font-bold text-white flex items-center gap-1">
                                  <FiPackage size={11} className="text-cyan-400" />
                                  #{ord.orderNumber}
                                </span>
                                <span className="rounded-full bg-cyan-500/20 px-1.5 py-0.2 text-[9px] font-semibold text-cyan-300 border border-cyan-500/30">
                                  {ord.status}
                                </span>
                              </div>
                              <p className="mt-1 text-[11px] text-slate-300">{ord.pharmacyName}</p>
                              <div className="mt-1.5 flex items-center justify-between text-[11px] pt-1 border-t border-white/10">
                                <span className="font-bold text-white">₹{Number(ord.totalAmount).toFixed(2)} ({ord.totalItems} items)</span>
                                <span className="text-[10px] text-slate-400">{ord.createdAt}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Explicit Action Buttons and Follow-up Questions (Visually Distinct) */}
                {msg.role === 'assistant' && (
                  <div className="mt-2 flex flex-wrap gap-1.5 max-w-[95%]">
                    {/* Explicit Navigation & Separate Action Buttons */}
                    {msg.actions &&
                      msg.actions.map((act, idx) => (
                        <button
                          key={`act-${idx}`}
                          onClick={() => handleActionClick(act)}
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold shadow-sm backdrop-blur-md transition-all active:scale-95 ${
                            act.action === 'NAVIGATE'
                              ? 'border border-cyan-400/50 bg-gradient-to-r from-primary-900/90 to-cyan-900/90 text-cyan-200 hover:from-primary-800 hover:to-cyan-800 hover:text-white'
                              : 'border border-cyan-400/40 bg-cyan-950/70 text-cyan-300 hover:bg-cyan-900 hover:border-cyan-300'
                          }`}
                        >
                          {act.action === 'NAVIGATE' ? (
                            <FiExternalLink size={11} className="text-cyan-300 shrink-0" />
                          ) : (
                            <FiCornerDownRight size={11} className="text-cyan-400 shrink-0" />
                          )}
                          {act.label}
                        </button>
                      ))}

                    {/* Suggested Question Chips (when no custom actions or as follow-ups) */}
                    {(!msg.actions || msg.actions.length === 0) &&
                      msg.suggestedActions?.map((actionText, idx) => (
                        <button
                          key={`sugg-${idx}`}
                          onClick={() => handleActionClick(actionText)}
                          className="inline-flex items-center gap-1 rounded-full border border-cyan-400/35 bg-cyan-950/60 px-2.5 py-1 text-xs font-medium text-cyan-300 shadow-sm backdrop-blur-md transition-colors hover:bg-cyan-900/80 active:scale-95"
                        >
                          <FiCornerDownRight size={11} className="text-cyan-400 shrink-0" />
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
