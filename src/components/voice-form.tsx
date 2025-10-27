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
                    const extractedDetails = await handleExtractTripDetails(transcript);
                    if (extractedDetails) {
                        if (extractedDetails.origin) form.setValue("origin", extractedDetails.origin);
                        if (extractedDetails.destination) form.setValue("destination", extractedDetails.destination);
                        if (extractedDetails.tripDuration) form.setValue("tripDuration", extractedDetails.tripDuration);
                        if (extractedDetails.interests) form.setValue("interests", extractedDetails.interests);

                        toast({
                            title: "Trip Details Extracted",
                            description: "Your trip details have been filled in from your voice command.",
                        });
                    }
                    onTranscriptionComplete(transcript);
                } catch (error) {
                    toast({
                        title: "Extraction Failed",
                        description: "Could not extract details from your speech. Please try again.",
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
            <div className="absolute top-4 right-4">
                <VoiceInput
                    isListening={isListening}
                    onToggleListening={handleToggleListening}
                    isSupported={isSupported}
                />
            </div>
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
