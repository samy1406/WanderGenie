"use client";

import type { Dispatch, SetStateAction } from "react";
import { useForm, type UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form
} from "@/components/ui/form";
import { handleGenerateItinerary, handleGetTravelOptions } from "@/app/actions";
import type { GeneratePersonalizedItineraryOutput } from "@/ai/flows/generate-personalized-itinerary";
import type { GetTravelOptionsOutput } from "@/ai/flows/get-travel-options";
import { useToast } from "@/hooks/use-toast";
import { ManualForm } from "./manual-form";

export const formSchema = z.object({
  origin: z.string().min(2, "Origin must be at least 2 characters."),
  destination: z.string().min(2, "Destination must be at least 2 characters."),
  tripDuration: z.coerce.number().min(1, "Duration must be at least 1 day.").max(14, "Duration cannot exceed 14 days."),
  interests: z.string().min(10, "Tell us a bit more about your interests."),
  travelPreference: z.enum(["budget", "comfort", "speed"]),
  departureTime: z.string().optional(),
  arrivalTime: z.string().optional(),
});

type ItineraryFormProps = {
  form: UseFormReturn<z.infer<typeof formSchema>>;
  onSubmit: (values: z.infer<typeof formSchema>) => void;
  isLoading: boolean;
};

export default function ItineraryForm({ form, onSubmit, isLoading }: ItineraryFormProps) {

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-full">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <ManualForm form={form} isLoading={isLoading} />
          </div>
      </form>
    </Form>
  );
}
