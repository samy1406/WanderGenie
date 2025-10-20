"use client";

import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { Button } from "./ui/button";
import { Mic, MicOff, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type VoiceInputProps = {
  onTranscription: (text: string) => void;
  isListening: boolean;
  onToggleListening: () => void;
};

export const VoiceInput = ({ onTranscription, isListening, onToggleListening }: VoiceInputProps) => {
  const { toast } = useToast();
  const {
    isSupported,
  } = useSpeechRecognition({
    onResult: (result) => {
        onTranscription(result);
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
        <div className="p-2" title="Voice input is not supported in your browser.">
            <AlertCircle className="h-5 w-5 text-destructive" />
        </div>
    );
  }

  return (
    <Button
      type="button"
      size="icon"
      variant="ghost"
      onClick={onToggleListening}
      className="h-14 w-14 rounded-full"
      title={isListening ? "Stop Listening" : "Start Listening"}
    >
      {isListening ? (
        <Mic className="h-8 w-8 text-destructive animate-pulse" />
      ) : (
        <Mic className="h-8 w-8 text-muted-foreground" />
      )}
    </Button>
  );
};
