"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Form
} from "@/components/ui/form";
import { ManualForm } from "./manual-form";
import type { TripType } from "./trip-planner";
import { VoiceForm } from "./voice-form";

export const formSchema = z.object({
  origin: z.string().min(2, "Origin must be at least 2 characters."),
  destination: z.string().min(2, "Destination must be at least 2 characters."),
  tripDuration: z.coerce.number().min(1, "Duration must be at least 1 day.").max(14, "Duration cannot exceed 14 days."),
  interests: z.string().min(10, "Tell us a bit more about your interests."),
  travelPreference: z.enum(["budget", "comfort", "speed"]),
  departureTime: z.string().optional(),
  arrivalTime: z.string().optional(),
  returnDate: z.date().optional(),
  tripType: z.enum(["oneway", "roundtrip"]),
});


type ItineraryFormProps = {
  form: ReturnType<typeof useForm<z.infer<typeof formSchema>>>;
  onSubmit: (values: z.infer<typeof formSchema>) => void;
  isLoading: boolean;
  tripType: TripType;
};

export default function ItineraryForm({ form, onSubmit, isLoading, tripType }: ItineraryFormProps) {

  const onTranscriptionComplete = (transcribedText: string) => {
    // You could call an AI flow here to parse the text and set form values
    console.log("Transcribed text:", transcribedText);
    // For now, let's just log it. A real implementation would use handleExtractTripDetails
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-full">
          <div className="relative">
            <ManualForm form={form} isLoading={isLoading} tripType={tripType} />
          </div>
      </form>
    </Form>
  );
}
