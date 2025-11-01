
"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Form
} from "@/components/ui/form";
import { ManualForm } from "./manual-form";
import type { TripType } from "./trip-planner";

export const formSchema = z.object({
  origin: z.string().min(2, "Origin must be at least 2 characters."),
  destination: z.string().min(2, "Destination must be at least 2 characters."),
  departureDate: z.date({
    required_error: "A departure date is required.",
  }),
  returnDate: z.date().optional(),
  tripDuration: z.coerce.number().min(1, "Duration must be at least 1 day.").max(14, "Duration cannot exceed 14 days."),
  interests: z.string().min(10, "Tell us a bit more about your interests."),
  travelPreference: z.enum(["budget", "comfort", "speed"]),
  departureTime: z.string().optional(),
  arrivalTime: z.string().optional(),
  tripType: z.enum(["oneway", "roundtrip"]),
  adults: z.coerce.number().min(1, "At least one adult is required.").default(1),
  children: z.coerce.number().min(0).default(0),
  infants: z.coerce.number().min(0).default(0),
}).refine(data => {
    if (data.tripType === 'roundtrip') {
        return !!data.returnDate;
    }
    return true;
}, {
    message: "Return date is required for a round trip",
    path: ["returnDate"],
}).refine(data => {
    if(data.returnDate && data.departureDate) {
        return data.returnDate > data.departureDate;
    }
    return true;
}, {
    message: "Return date must be after departure date",
    path: ["returnDate"],
});


type ItineraryFormProps = {
  form: ReturnType<typeof useForm<z.infer<typeof formSchema>>>;
  onSubmit: (values: z.infer<typeof formSchema>) => void;
  isLoading: boolean;
  tripType: TripType;
  setTripType: (tripType: TripType) => void;
};

export default function ItineraryForm({ form, onSubmit, isLoading, tripType, setTripType }: ItineraryFormProps) {

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-full">
          <div className="relative">
            <ManualForm form={form} isLoading={isLoading} tripType={tripType} setTripType={setTripType} />
          </div>
      </form>
    </Form>
  );
}
