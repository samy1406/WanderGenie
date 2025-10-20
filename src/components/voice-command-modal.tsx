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
import { Mic, Bot, Sparkles, User, CheckCircle, ThumbsUp, ThumbsDown } from "lucide-react";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { type UseFormReturn } from "react-hook-form";
import { type z } from "zod";
import { type formSchema } from "./itinerary-form";
import { Badge } from "./ui/badge";

type VoiceCommandModalProps = {
    form: UseFormReturn<z.infer<typeof formSchema>>;
};

type ConversationStep = "origin" | "destination" | "tripDuration" | "interests" | "travelPreference" | "departureTime" | "arrivalTime" | "done";

type Question = {
    step: ConversationStep;
    question: string;
    example: string;
    field: keyof z.infer<typeof formSchema>;
    options?: readonly { value: string; label: string }[];
};

const conversationFlow: Question[] = [
    { step: "origin", question: "First, where will your journey begin?", example: "e.g., 'Mumbai'", field: "origin" },
    { step: "destination", question: "Great! And where are you heading to?", example: "e.g., 'Goa'", field: "destination" },
    { step: "tripDuration", question: "How many days will your trip be?", example: "e.g., '5 days'", field: "tripDuration" },
    { step: "interests", question: "What do you want to do there? What are your interests?", example: "e.g., 'Relax on the beach and enjoy local food'", field: "interests" },
    { 
        step: "travelPreference", 
        question: "What's your travel preference?", 
        example: "Say 'budget', 'comfort', or 'speed'", 
        field: "travelPreference",
        options: [{value: "budget", label: "Budget"}, {value: "comfort", label: "Comfort"}, {value: "speed", label: "Speed"}]
    },
    { 
        step: "departureTime", 
        question: "What's your preferred departure time?", 
        example: "e.g., 'morning'", 
        field: "departureTime",
        options: [
            { value: 'any', label: 'Any Time' },
            { value: 'morning', label: 'Morning' },
            { value: 'afternoon', label: 'Afternoon' },
            { value: 'evening', label: 'Evening' },
            { value: 'night', label: 'Night' },
          ]
    },
    { 
        step: "arrivalTime", 
        question: "And your preferred arrival time?", 
        example: "e.g., 'evening'", 
        field: "arrivalTime",
        options: [
            { value: 'any', label: 'Any Time' },
            { value: 'morning',label: 'Morning' },
            { value: 'afternoon',label: 'Afternoon' },
            { value: 'evening', label: 'Evening' },
            { value: 'night', label: 'Night' },
          ]
    },
];

export default function VoiceCommandModal({ form }: VoiceCommandModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState<ConversationStep>("origin");
  const [transcribedText, setTranscribedText] = useState("");
  const [pendingConfirmationText, setPendingConfirmationText] = useState<string | null>(null);
  const { toast } = useToast();

  const resetState = useCallback(() => {
    setCurrentStep("origin");
    setTranscribedText("");
    setPendingConfirmationText(null);
  }, []);

  const handleNextStep = useCallback(() => {
    const currentIndex = conversationFlow.findIndex(q => q.step === currentStep);
    if (currentIndex < conversationFlow.length - 1) {
      setCurrentStep(conversationFlow[currentIndex + 1].step);
    } else {
      setCurrentStep("done");
      toast({
        title: "Got it!",
        description: "I've filled out the form with your details.",
      });
      setTimeout(() => setIsOpen(false), 2000);
    }
  }, [currentStep, toast]);

  const processTranscription = useCallback((text: string) => {
    if (!text) return;

    if (pendingConfirmationText) {
        const lowercasedText = text.toLowerCase();
        if (lowercasedText.includes("yes")) {
            const currentQuestion = conversationFlow.find(q => q.step === currentStep)!;
            let valueToSet: string | number = pendingConfirmationText;

            if (currentQuestion.field === 'tripDuration') {
                valueToSet = parseInt(pendingConfirmationText.match(/\d+/)?.[0] || "1", 10) || 1;
            } else if (currentQuestion.options) {
                const matchedOption = currentQuestion.options.find(opt => pendingConfirmationText.toLowerCase().includes(opt.value));
                if (matchedOption) {
                    valueToSet = matchedOption.value;
                } else {
                    toast({ title: "Invalid Option", description: `Please say one of the available options.`, variant: "destructive"});
                    setPendingConfirmationText(null);
                    setTranscribedText("");
                    return;
                }
            }
            form.setValue(currentQuestion.field, valueToSet);
            setPendingConfirmationText(null);
            setTranscribedText("");
            handleNextStep();
        } else if (lowercasedText.includes("no")) {
            setPendingConfirmationText(null);
            setTranscribedText("");
        } else {
            toast({ title: "Please confirm", description: "Please say 'Yes' or 'No'.", variant: "destructive" });
        }
        return;
    }

    setPendingConfirmationText(text);

  }, [currentStep, form, handleNextStep, pendingConfirmationText, toast]);

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
        resetState();
    }
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
        
        <div className="space-y-4 py-4 min-h-[250px] flex flex-col justify-between">
            {currentStep !== 'done' && currentQuestionData && !pendingConfirmationText && (
                 <div className="p-4 rounded-lg bg-muted/50 border border-primary/10 text-center">
                    <p className="font-semibold text-primary">{currentQuestionData.question}</p>
                    <p className="text-xs text-muted-foreground mt-1">{currentQuestionData.example}</p>
                    {currentQuestionData.options && (
                        <div className="flex flex-wrap gap-2 justify-center mt-3">
                            {currentQuestionData.options.map(opt => <Badge key={opt.value} variant="secondary">{opt.label}</Badge>)}
                        </div>
                    )}
                </div>
            )}

            {pendingConfirmationText && (
                <div className="p-4 rounded-lg bg-amber-100 dark:bg-amber-900/50 border border-amber-300 text-center">
                    <p className="text-sm text-muted-foreground">I heard:</p>
                    <p className="font-bold text-lg text-amber-900 dark:text-amber-200">"{pendingConfirmationText}"</p>
                    <p className="font-semibold mt-3">Is this correct?</p>
                </div>
            )}
           
            <div className="flex flex-col items-center justify-center gap-4">
                <Button
                    type="button"
                    size="icon"
                    variant={isListening ? "destructive" : "default"}
                    onClick={handleToggleListening}
                    className="h-20 w-20 rounded-full disabled:opacity-50"
                    disabled={currentStep === 'done'}
                    >
                    <Mic className="h-10 w-10" />
                </Button>
                <p className="text-sm text-muted-foreground h-5">
                    {isListening ? "Listening..." : (pendingConfirmationText ? "Say 'Yes' or 'No'" : "Click the mic to answer")}
                </p>
            </div>


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
