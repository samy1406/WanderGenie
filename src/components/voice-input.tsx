"use client";

import { Mic, CircleAlert, Waves } from "lucide-react";
import { Button } from "./ui/button";

type VoiceInputProps = {
  isListening: boolean;
  onToggleListening: () => void;
  isSupported: boolean;
};

export const VoiceInput = ({ isListening, onToggleListening, isSupported }: VoiceInputProps) => {
  const getTitle = () => {
    if (!isSupported) {
      return "Voice input is not supported in your browser.";
    }
    if (isListening) {
      return "Stop Listening";
    }
    return "Start Listening";
  };

  return (
    <Button
      type="button"
      size="icon"
      variant="ghost"
      onClick={onToggleListening}
      disabled={!isSupported}
      title={getTitle()}
      className="text-gray-600 hover:bg-gray-100 hover:text-gray-900"
    >
      {isListening ? (
        <Waves className="h-6 w-6 text-accent" />
      ) : !isSupported ? (
        <CircleAlert className="h-6 w-6 text-destructive" />
      ) : (
        <Mic className="h-6 w-6" />
      )}
    </Button>
  );
};
