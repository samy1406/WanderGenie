"use client";

import { useState, useEffect, useRef } from "react";
import "regenerator-runtime/runtime";

type UseSpeechRecognitionOptions = {
    onTranscriptChanged: (transcript: string) => void;
};

export function useSpeechRecognition({ onTranscriptChanged }: UseSpeechRecognitionOptions) {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState("");
    const [isSupported, setIsSupported] = useState(false);
    const recognitionRef = useRef<SpeechRecognition | null>(null);

    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            setIsSupported(true);
            const recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = "en-US";

            recognition.onresult = (event) => {
                let finalTranscript = "";
                for (let i = 0; i < event.results.length; i++) {
                    finalTranscript += event.results[i][0].transcript;
                }
                setTranscript(finalTranscript);
                onTranscriptChanged(finalTranscript);
            };

            recognition.onerror = (event) => {
                console.error("Speech recognition error", event.error);
                setIsListening(false);
            };
            
            recognition.onend = () => {
                 if (recognitionRef.current) { // Check if we are still meant to be listening
                    recognition.start(); // Restart if ended unexpectedly
                 }
            };

            recognitionRef.current = recognition;
        } else {
            setIsSupported(false);
        }

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.onend = null; // Prevent restart on component unmount
                recognitionRef.current.stop();
            }
        };
    }, [onTranscriptChanged]);

    const startListening = () => {
        if (recognitionRef.current) {
            setTranscript("");
            setIsListening(true);
            recognitionRef.current.start();
        }
    };

    const stopListening = () => {
        if (recognitionRef.current) {
            setIsListening(false);
            recognitionRef.current.stop();
        }
    };

    return { isListening, transcript, startListening, stopListening, isSupported };
}
