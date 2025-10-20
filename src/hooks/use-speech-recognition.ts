
"use client";

import { useState, useEffect, useRef } from 'react';
import 'regenerator-runtime/runtime';

interface SpeechRecognitionOptions {
  onResult: (result: string) => void;
  onError: (error: string) => void;
}

// Check for SpeechRecognition API
const SpeechRecognition =
  (typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition));

export const useSpeechRecognition = ({ onResult, onError }: SpeechRecognitionOptions) => {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    if (!SpeechRecognition) {
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = (event) => {
      let errorMessage = 'An unknown error occurred.';
      if (event.error === 'no-speech') {
        errorMessage = 'No speech was detected. Please try again.';
      } else if (event.error === 'audio-capture') {
        errorMessage = 'Microphone not available. Please check your microphone settings.';
      } else if (event.error === 'not-allowed') {
        errorMessage = 'Microphone access was denied. Please allow microphone access in your browser settings.';
      }
      onError(errorMessage);
    };

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0])
        .map((result) => result.transcript)
        .join('');
      onResult(transcript);
    };

    recognitionRef.current = recognition;

    return () => {
        recognition.stop();
    }
  }, [onError, onResult]);

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
      } catch (error) {
        onError("Could not start voice recognition. Please try again.");
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  };

  return {
    isListening,
    isSupported: !!SpeechRecognition,
    startListening,
    stopListening,
  };
};
