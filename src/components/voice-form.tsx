
"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { VoiceInput } from "./voice-input";
import { handleExtractTripDetails } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
import { formSchema } from "./itinerary-form";

type VoiceFormProps = {
    onTranscriptionComplete: (text: string) => void;
    form: ReturnType<typeof useForm<z.infer<typeof formSchema>>>;
};

export function VoiceForm({ onTranscriptionComplete, form }: VoiceFormProps) {
    const { toast } = useToast();
    const {
        isListening,
        startListening,
        stopListening,
        isSupported,
        transcript,
    } = useSpeechRecognition({
        onTranscriptChanged: (newTranscript) => {
            console.log(newTranscript);
        },
    });

    const handleToggleListening = async () => {
        if (isListening) {
            stopListening();
            if (transcript) {
                try {
                    const response = await handleExtractTripDetails(transcript);

                    if (response.success) {
                        const extractedDetails = response.data;
                        if (extractedDetails.origin) form.setValue("origin", extractedDetails.origin);
                        if (extractedDetails.destination) form.setValue("destination", extractedDetails.destination);
                        if (extractedDetails.tripDuration) form.setValue("tripDuration", extractedDetails.tripDuration);
                        if (extractedDetails.interests) form.setValue("interests", extractedDetails.interests);

                        toast({
                            title: "Trip Details Extracted",
                            description: "Your trip details have been filled in from your voice command.",
                        });
                    } else {
                         throw new Error(response.error);
                    }
                    onTranscriptionComplete(transcript);
                } catch (error) {
                     const errorMessage = error instanceof Error ? error.message : "Could not extract details from your speech.";
                    toast({
                        title: "Extraction Failed",
                        description: errorMessage,
                        variant: "destructive",
                    });
                }
            }
        } else {
            startListening();
        }
    };

    return (
        <>
            <VoiceInput
                isListening={isListening}
                onToggleListening={handleToggleListening}
                isSupported={isSupported}
            />
            {isListening && (
                <div className="fixed inset-0 bg-black/70 z-40 flex flex-col items-center justify-center backdrop-blur-sm">
                    <div className="text-white text-center">
                        <p className="text-2xl font-bold mb-4">Listening...</p>
                        <p className="max-w-xl">{transcript || "Speak now..."}</p>
                    </div>
                </div>
            )}
        </>
    );
}
