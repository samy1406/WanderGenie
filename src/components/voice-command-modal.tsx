"use client";

import { useState, useCallback, useEffect } from "react";
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
import { Mic, Bot, Sparkles, User, CheckCircle } from "lucide-react";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { type UseFormReturn } from "react-hook-form";
import { type z } from "zod";
import { type formSchema } from "./itinerary-form";

type VoiceCommandModalProps = {
    form: UseFormReturn<z.infer<typeof formSchema>>;
};

type ConversationStep = "origin" | "destination" | "tripDuration" | "interests" | "done";

const conversationFlow: { step: ConversationStep; question: string; example: string; field: keyof z.infer<typeof formSchema> }[] = [
    { step: "origin", question: "First, where will your journey begin?", example: "e.g., 'Mumbai'", field: "origin" },
    { step: "destination", question: "Great! And where are you heading to?", example: "e.g., 'Goa'", field: "destination" },
    { step: "tripDuration", question: "How many days will your trip be?", example: "e.g., '5 days'", field: "tripDuration" },
    { step: "interests", question: "What do you want to do there? What are your interests?", example: "e.g., 'Relax on the beach and enjoy local food'", field: "interests" },
];

export default function VoiceCommandModal({ form }: VoiceCommandModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState<ConversationStep>("origin");
  const [transcribedText, setTranscribedText] = useState("");
  const { toast } = useToast();

  const handleNextStep = useCallback((text: string) => {
    if (!text) return;
    
    const currentQuestion = conversationFlow.find(q => q.step === currentStep);
    if (!currentQuestion) return;

    if (currentQuestion.field === 'tripDuration') {
        const days = parseInt(text.match(/\d+/)?.[0] || "0", 10);
        form.setValue(currentQuestion.field, days > 0 ? days : 1);
    } else {
        form.setValue(currentQuestion.field, text);
    }

    setTranscribedText("");

    const currentIndex = conversationFlow.findIndex(q => q.step === currentStep);
    if (currentIndex < conversationFlow.length - 1) {
      setCurrentStep(conversationFlow[currentIndex + 1].step);
    } else {
      setCurrentStep("done");
      toast({
        title: "Got it!",
        description: "I've filled out the form with your details.",
      });
      setTimeout(() => setIsOpen(false), 1500);
    }
  }, [currentStep, form, toast]);

  const {
    isListening,
    isSupported,
    startListening,
    stopListening,
  } = useSpeechRecognition({
    onResult: (result) => {
        setTranscribedText(result);
        handleNextStep(result);
    },
    onError: (error) => {
        toast({
            title: "Voice Error",
            description: error,
            variant: "destructive"
        });
    }
  });

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
    if(open) {
        setCurrentStep("origin");
    }
    setTranscribedText("");
    setIsOpen(open);
  }

  const currentQuestionData = conversationFlow.find(q => q.step === currentStep);

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
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="text-primary"/> Let's Plan Your Trip
          </DialogTitle>
          <DialogDescription>
            Answer a few questions and I'll fill out the form for you.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
            {currentStep !== 'done' && currentQuestionData && (
                 <div className="p-4 rounded-lg bg-muted/50 border border-primary/10 text-center">
                    <p className="font-semibold text-primary">{currentQuestionData.question}</p>
                    <p className="text-xs text-muted-foreground mt-1">{currentQuestionData.example}</p>
                </div>
            )}
           
            <div className="flex flex-col items-center justify-center gap-4">
                <Button
                    type="button"
                    size="icon"
                    variant={isListening ? "destructive" : "default"}
                    onClick={handleToggleListening}
                    className="h-24 w-24 rounded-full disabled:opacity-50"
                    disabled={currentStep === 'done'}
                    >
                    <Mic className="h-12 w-12" />
                </Button>
                <p className="text-sm text-muted-foreground h-5">
                    {isListening ? "Listening..." : "Click the mic to answer"}
                </p>
            </div>

            {transcribedText && (
                <div className="w-full p-3 rounded-lg bg-muted text-sm flex items-center gap-2">
                    <User className="h-4 w-4 flex-shrink-0" />
                    <p className="italic">"{transcribedText}"</p>
                </div>
            )}

            {currentStep === 'done' && (
                <div className="flex flex-col items-center justify-center gap-3 text-center p-4 rounded-lg bg-green-50 dark:bg-green-900/30">
                    <CheckCircle className="h-12 w-12 text-green-500" />
                    <h3 className="font-semibold text-green-700 dark:text-green-300">All set!</h3>
                    <p className="text-sm text-muted-foreground">You can now generate your itinerary.</p>
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
