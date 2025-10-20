"use client";

import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { Button } from "./ui/button";
import { Mic, MicOff, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type VoiceInputProps = {
  onTranscriptionEnd: (text: string) => void;
};

export const VoiceInput = ({ onTranscriptionEnd }: VoiceInputProps) => {
  const { toast } = useToast();
  const {
    isListening,
    isSupported,
    startListening,
    stopListening,
  } = useSpeechRecognition({
    onResult: (result) => {
        onTranscriptionEnd(result);
        toast({
            title: "Text Transcribed",
            description: "Your voice input has been added to the text area."
        })
    },
    onError: (error) => {
        toast({
            title: "Voice Error",
            description: error,
            variant: "destructive"
        })
    }
  });

  if (!isSupported) {
    return (
        <div className="absolute right-2 top-1/2 -translate-y-1/2 p-2" title="Voice input is not supported in your browser.">
            <AlertCircle className="h-5 w-5 text-destructive" />
        </div>
    );
  }

  const handleToggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <Button
      type="button"
      size="icon"
      variant="ghost"
      onClick={handleToggleListening}
      className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
      title={isListening ? "Stop Listening" : "Start Listening"}
    >
      {isListening ? (
        <Mic className="text-destructive animate-pulse" />
      ) : (
        <MicOff className="text-muted-foreground" />
      )}
    </Button>
  );
};
