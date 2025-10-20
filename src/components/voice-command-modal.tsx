"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Mic, Bot } from "lucide-react";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { handleExtractTripDetails } from "@/app/actions";
import { type UseFormReturn } from "react-hook-form";
import { type z } from "zod";
import { type formSchema } from "./itinerary-form";

type VoiceCommandModalProps = {
    form: UseFormReturn<z.infer<typeof formSchema>>;
};

export default function VoiceCommandModal({ form }: VoiceCommandModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcribedText, setTranscribedText] = useState("");
  const { toast } = useToast();

  const {
    isListening,
    isSupported,
    startListening,
    stopListening,
  } = useSpeechRecognition({
    onResult: (result) => {
        setTranscribedText(result);
        processTranscription(result);
    },
    onError: (error) => {
        toast({
            title: "Voice Error",
            description: error,
            variant: "destructive"
        })
        setIsProcessing(false);
    }
  });

  const processTranscription = async (text: string) => {
    if (!text) return;
    setIsProcessing(true);
    try {
        const extractedDetails = await handleExtractTripDetails(text);
        if (extractedDetails.origin) form.setValue('origin', extractedDetails.origin);
        if (extractedDetails.destination) form.setValue('destination', extractedDetails.destination);
        if (extractedDetails.tripDuration) form.setValue('tripDuration', extractedDetails.tripDuration);
        if (extractedDetails.interests) form.setValue('interests', extractedDetails.interests);

        toast({
            title: "Form Updated!",
            description: "I've filled out the form with the details from your request.",
        })
        setIsOpen(false);
    } catch(e) {
        console.error(e);
        toast({
            title: "Analysis Failed",
            description: "I couldn't understand all the details. Please try again.",
            variant: "destructive"
        })
    } finally {
        setIsProcessing(false);
    }
  }

  const handleToggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      setTranscribedText("");
      startListening();
    }
  };
  
  const handleOpenChange = (open: boolean) => {
    if (isListening) {
        stopListening();
    }
    setTranscribedText("");
    setIsProcessing(false);
    setIsOpen(open);
  }


  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className="text-primary hover:text-primary hover:bg-primary/10">
            <Mic className="mr-2 h-4 w-4" />
            Plan with Voice
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Plan Your Trip with Voice</DialogTitle>
          <DialogDescription>
            Just tell me what you have in mind. For example: "Plan a 5 day trip to Goa from Mumbai. I want to relax on the beach."
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center gap-4 py-8">
            <Button
                type="button"
                size="icon"
                variant={isListening ? "destructive" : "default"}
                onClick={handleToggleListening}
                className="h-24 w-24 rounded-full"
                disabled={isProcessing}
                >
                <Mic className="h-12 w-12" />
            </Button>
            <p className="text-sm text-muted-foreground">
                {isProcessing ? "Analyzing your request..." : isListening ? "Listening..." : "Click the mic to start"}
            </p>

            {(isProcessing || transcribedText) && (
                <div className="w-full mt-4 p-4 rounded-lg bg-muted text-sm">
                    <p className="font-medium">{transcribedText}</p>
                </div>
            )}
        </div>
        <DialogFooter>
            <p className="text-xs text-muted-foreground flex items-center gap-2">
                <Bot className="h-4 w-4" /> AI-powered voice commands
            </p>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
