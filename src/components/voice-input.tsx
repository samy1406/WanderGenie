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
      variant="outline"
      onClick={onToggleListening}
      disabled={!isSupported}
      title={getTitle()}
      className="bg-white/10 border-white/20 text-white hover:bg-white/20"
    >
      {isListening ? (
        <>
          <Waves className="h-5 w-5 mr-2" />
          Listening...
        </>
      ) : !isSupported ? (
        <>
          <CircleAlert className="h-5 w-5 mr-2 text-destructive" />
          Voice not supported
        </>
      ) : (
        <>
            <Mic className="h-5 w-5 mr-2" />
            Use Voice Command
        </>
      )}
    </Button>
  );
};
