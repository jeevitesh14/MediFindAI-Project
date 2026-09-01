import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';

export const LANGUAGE_SPEECH_MAP = {
  en: 'en-IN',
  te: 'te-IN',
  hi: 'hi-IN',
};

export default function useVoiceSearch({ onResult, lang } = {}) {
  const { i18n } = useTranslation();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState(null);
  const [isSupported, setIsSupported] = useState(false);

  const recognitionRef = useRef(null);
  const accumulatedTranscriptRef = useRef('');
  const hasDeliveredRef = useRef(false);
  const onResultRef = useRef(onResult);

  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  // Determine active recognition language
  const currentLang = lang || LANGUAGE_SPEECH_MAP[i18n.language?.split('-')[0]] || 'en-IN';

  useEffect(() => {
    const SpeechRecognition =
      typeof window !== 'undefined' &&
      (window.SpeechRecognition || window.webkitSpeechRecognition);

    setIsSupported(Boolean(SpeechRecognition));
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        // already stopped
      }
    }
    setIsListening(false);
  }, []);

  const startListening = useCallback(async () => {
    const SpeechRecognition =
      typeof window !== 'undefined' &&
      (window.SpeechRecognition || window.webkitSpeechRecognition);

    if (!SpeechRecognition) {
      const msg = 'Voice recognition is not supported in this browser. Please try Chrome, Edge, or Safari.';
      setError(msg);
      toast.info(msg);
      return;
    }

    // Proactively check/request microphone permission where supported
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // Release immediate audio stream to let SpeechRecognition use it cleanly
        stream.getTracks().forEach((track) => track.stop());
      } catch (err) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          const msg = 'Microphone permission was denied. Please enable microphone access in your browser settings.';
          setError(msg);
          toast.warn(msg, { toastId: 'voice-perm-denied' });
          setIsListening(false);
          return;
        }
      }
    }

    // Stop any existing active instance
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {
        // ignore
      }
    }

    setError(null);
    setTranscript('');
    accumulatedTranscriptRef.current = '';
    hasDeliveredRef.current = false;

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;

      recognition.lang = currentLang;
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        hasDeliveredRef.current = false;
      };

      recognition.onresult = (event) => {
        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const result = event.results[i];
          if (result.isFinal) {
            final += result[0].transcript;
          } else {
            interim += result[0].transcript;
          }
        }

        const recognizedText = (final || interim).trim();
        if (recognizedText) {
          setTranscript(recognizedText);
          accumulatedTranscriptRef.current = recognizedText;
        }

        if (final.trim() && !hasDeliveredRef.current) {
          hasDeliveredRef.current = true;
          setIsListening(false);
          if (onResultRef.current) {
            onResultRef.current(final.trim());
          }
        }
      };

      recognition.onerror = (event) => {
        let userMessage = 'Voice recognition error. Please try again.';

        switch (event.error) {
          case 'not-allowed':
          case 'service-not-allowed':
            userMessage = 'Microphone permission was denied. Please allow microphone access in your browser settings.';
            toast.warn(userMessage, { toastId: 'voice-perm-error' });
            break;
          case 'no-speech':
            userMessage = 'No speech detected. Please speak clearly into your microphone.';
            break;
          case 'audio-capture':
            userMessage = 'No microphone was detected on your device.';
            toast.warn(userMessage, { toastId: 'voice-no-mic' });
            break;
          case 'network':
            userMessage = 'Network error during voice recognition. Please check your internet connection.';
            toast.warn(userMessage, { toastId: 'voice-network-err' });
            break;
          case 'aborted':
            setIsListening(false);
            return;
          default:
            userMessage = `Voice recognition error: ${event.error}`;
        }

        setError(userMessage);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
        // If we collected speech that wasn't finalized yet, deliver it
        if (!hasDeliveredRef.current && accumulatedTranscriptRef.current.trim()) {
          hasDeliveredRef.current = true;
          if (onResultRef.current) {
            onResultRef.current(accumulatedTranscriptRef.current.trim());
          }
        }
      };

      recognition.start();
    } catch (err) {
      console.warn('SpeechRecognition start error:', err);
      const msg = 'Failed to start voice search. Please check microphone permissions.';
      setError(msg);
      setIsListening(false);
      toast.error(msg, { toastId: 'voice-start-err' });
    }
  }, [currentLang]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          // ignore
        }
      }
    };
  }, []);

  return {
    isListening,
    transcript,
    error,
    isSupported,
    startListening,
    stopListening,
  };
}
