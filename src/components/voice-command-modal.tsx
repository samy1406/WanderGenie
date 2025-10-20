
"use client";

import { useState, useCallback, useEffect, useRef } from "react";
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
import { Mic, Bot, Sparkles, CheckCircle, ThumbsUp, ThumbsDown, Loader2 } from "lucide-react";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { type UseFormReturn } from "react-hook-form";
import { type z } from "zod";
import { type formSchema } from "./itinerary-form";
import { Badge } from "./ui/badge";
import { Card, CardContent } from "./ui/card";

type VoiceCommandModalProps = {
    form: UseFormReturn<z.infer<typeof formSchema>>;
};

type ConversationStep = "origin" | "destination" | "tripDuration" | "interests" | "travelPreference" | "departureTime" | "arrivalTime" | "review" | "done";

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
    { step: "tripDuration", question: "How many days will your trip be?", example: "e.g., '5 days' or 'seven'", field: "tripDuration" },
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

const wordToNumber: { [key: string]: number } = {
    one: 1, two: 2, three: 3, four: 4, five: 5,
    six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
    eleven: 11, twelve: 12, thirteen: 13, fourteen: 14,
};

export default function VoiceCommandModal({ form }: VoiceCommandModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState<ConversationStep>("origin");
  const [transcribedText, setTranscribedText] = useState("");
  const [pendingConfirmationText, setPendingConfirmationText] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const transcriptRef = useRef("");

  const resetState = useCallback(() => {
    setCurrentStep("origin");
    setTranscribedText("");
    transcriptRef.current = "";
    setPendingConfirmationText(null);
    setIsSubmitting(false);
  }, []);

  const handleNextStep = useCallback(() => {
    const currentIndex = conversationFlow.findIndex(q => q.step === currentStep);
    if (currentIndex < conversationFlow.length - 1) {
      setCurrentStep(conversationFlow[currentIndex + 1].step);
    } else {
      setCurrentStep("review");
    }
  }, [currentStep]);

  const handleConfirmation = (confirmed: boolean) => {
    if (confirmed) {
        const currentQuestion = conversationFlow.find(q => q.step === currentStep)!;
        let valueToSet: string | number = transcriptRef.current;

        if (currentQuestion.field === 'tripDuration') {
            const text = transcriptRef.current.toLowerCase();
            const numberMatch = text.match(/\d+/);
            if (numberMatch) {
                valueToSet = parseInt(numberMatch[0], 10);
            } else {
                const wordMatch = text.split(' ').find(word => wordToNumber[word]);
                if (wordMatch) {
                    valueToSet = wordToNumber[wordMatch];
                } else {
                    valueToSet = 1;
                }
            }
        } else if (currentQuestion.options) {
            const text = transcriptRef.current.toLowerCase();
            const matchedOption = currentQuestion.options.find(opt => text.includes(opt.value));
            if (matchedOption) {
                valueToSet = matchedOption.value;
            } else {
                toast({ title: "Invalid Option", description: `I couldn't match that to an option. Please try again.`, variant: "destructive"});
                setPendingConfirmationText(null);
                setTranscribedText("");
                transcriptRef.current = "";
                return;
            }
        }
        form.setValue(currentQuestion.field, valueToSet);
        handleNextStep();
    }
    setPendingConfirmationText(null);
    setTranscribedText("");
    transcriptRef.current = "";
  };

  const {
    isListening,
    isSupported,
    startListening,
    stopListening,
  } = useSpeechRecognition({
    onResult: (result) => {
      transcriptRef.current = result;
      setTranscribedText(result);
    },
    onEnd: () => {
      if (transcriptRef.current) {
        setPendingConfirmationText(transcript_ref.current);
      }
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
      transcriptRef.current = "";
      setPendingConfirmationText(null);
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

  const handleGenerate = async () => {
    setIsSubmitting(true);
    await form.handleSubmit((values) => {
        setCurrentStep("done");
        toast({
            title: "Got it!",
            description: "Your details are confirmed. Click 'Generate Itinerary' to proceed.",
        });
        setTimeout(() => {
            setIsOpen(false);
            // This needs to be in a timeout to ensure the modal closes before the form submits,
            // otherwise the main page's submit handler may be blocked.
            document.querySelector<HTMLFormElement>('form')?.requestSubmit();
        }, 1000);
    })();
    setIsSubmitting(false); // This might not be reached if submission is successful and component unmounts
  }

  const currentQuestionData = conversationFlow.find(q => q.step === currentStep);
  const allFormData = form.getValues();

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
            {currentStep === "review" ? "Please review your details below." : "Answer a few questions and I'll fill out the form for you."}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4 min-h-[250px] flex flex-col justify-between">
            {currentStep !== 'done' && currentStep !== 'review' && !pendingConfirmationText && currentQuestionData &&(
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
                <Card className="bg-amber-100 dark:bg-amber-900/50 border-amber-300 text-center">
                    <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground">I heard:</p>
                        <p className="font-bold text-lg text-amber-900 dark:text-amber-200">"{pendingConfirmationText}"</p>
                        <p className="font-semibold mt-3">Is this correct?</p>
                        <div className="flex justify-center gap-4 mt-4">
                            <Button size="sm" onClick={() => handleConfirmation(true)}><ThumbsUp className="mr-2"/> Yes, Correct</Button>
                            <Button size="sm" variant="outline" onClick={() => handleConfirmation(false)}><ThumbsDown className="mr-2" /> No, Retry</Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {currentStep === 'review' && (
                <Card className="bg-muted/30">
                    <CardContent className="p-4 space-y-2 text-sm">
                        <h4 className="font-bold mb-2 text-center text-primary">Your Trip Details</h4>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                            <span className="font-semibold text-muted-foreground">Origin:</span> <span>{allFormData.origin}</span>
                            <span className="font-semibold text-muted-foreground">Destination:</span> <span>{allFormData.destination}</span>
                            <span className="font-semibold text-muted-foreground">Duration:</span> <span>{allFormData.tripDuration} days</span>
                            <span className="font-semibold text-muted-foreground">Preference:</span> <span className="capitalize">{allFormData.travelPreference}</span>
                            <span className="font-semibold text-muted-foreground">Departure:</span> <span className="capitalize">{allFormData.departureTime}</span>
                            <span className="font-semibold text-muted-foreground">Arrival:</span> <span className="capitalize">{allFormData.arrivalTime}</span>
                        </div>
                        <p className="pt-2"><span className="font-semibold text-muted-foreground">Interests:</span> {allFormData.interests}</p>
                    </CardContent>
                </Card>
            )}
           
            <div className="flex flex-col items-center justify-center gap-4">
               {currentStep !== 'review' && currentStep !== 'done' && (
                 <>
                    <Button
                        type="button"
                        size="icon"
                        variant={isListening ? "destructive" : "default"}
                        onClick={handleToggleListening}
                        className="h-20 w-20 rounded-full disabled:opacity-50"
                        disabled={!!pendingConfirmationText}
                    >
                        <Mic className="h-10 w-10" />
                    </Button>
                    <p className="text-sm text-muted-foreground h-5">
                        {isListening ? "Listening..." : (transcribedText ? `I heard: "${transcribedText}"` : "Click the mic to answer")}
                    </p>
                </>
               )}
            </div>

            {currentStep === 'review' && (
                <Button onClick={handleGenerate} disabled={isSubmitting} className="w-full">
                    {isSubmitting ? <Loader2 className="mr-2 animate-spin" /> : <Sparkles className="mr-2"/>}
                    Generate Itinerary
                </Button>
            )}

            {currentStep === 'done' && (
                <div className="flex flex-col items-center justify-center gap-3 text-center p-4 rounded-lg bg-green-50 dark:bg-green-900/30">
                    <CheckCircle className="h-12 w-12 text-green-500" />
                    <h3 className="font-semibold text-green-700 dark:text-green-300">All set!</h3>
                    <p className="text-sm text-muted-foreground">Your itinerary will now be generated.</p>
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
