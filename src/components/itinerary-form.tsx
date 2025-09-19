"use client";

import type { Dispatch, SetStateAction } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { handleGenerateItinerary, handleGetTravelOptions } from "@/app/actions";
import type { GeneratePersonalizedItineraryOutput } from "@/ai/flows/generate-personalized-itinerary";
import type { GetTravelOptionsOutput } from "@/ai/flows/get-travel-options";
import { useToast } from "@/hooks/use-toast";
import { Wand2 } from "lucide-react";

const formSchema = z.object({
  origin: z.string().min(2, "Origin must be at least 2 characters."),
  destination: z.string().min(2, "Destination must be at least 2 characters."),
  tripDuration: z.coerce.number().min(1, "Duration must be at least 1 day.").max(14, "Duration cannot exceed 14 days."),
  interests: z.string().min(10, "Tell us a bit more about your interests."),
  travelPreference: z.enum(["budget", "comfort", "speed"]),
  departureTime: z.string().optional(),
  arrivalTime: z.string().optional(),
});

type ItineraryFormProps = {
  setItinerary: Dispatch<SetStateAction<GeneratePersonalizedItineraryOutput | null>>;
  setTravelOptions: Dispatch<SetStateAction<GetTravelOptionsOutput | null>>;
  setOrigin: Dispatch<SetStateAction<string | null>>;
  setDestination: Dispatch<SetStateAction<string | null>>;
  setIsLoading: Dispatch<SetStateAction<boolean>>;
  setError: Dispatch<SetStateAction<string | null>>;
  isLoading: boolean;
};

export default function ItineraryForm({ setItinerary, setTravelOptions, setOrigin, setDestination, setIsLoading, setError, isLoading }: ItineraryFormProps) {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      origin: "",
      destination: "",
      tripDuration: 3,
      interests: "",
      travelPreference: "budget",
      departureTime: "any",
      arrivalTime: "any",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setError(null);
    setItinerary(null);
    setTravelOptions(null);
    setOrigin(values.origin);
    setDestination(values.destination);
    
    try {
      const [itineraryResult, travelOptionsResult] = await Promise.all([
        handleGenerateItinerary({
          destination: values.destination,
          tripDuration: values.tripDuration,
          interests: values.interests,
          travelPreference: values.travelPreference,
        }),
        handleGetTravelOptions({
            origin: values.origin,
            destination: values.destination,
            travelPreference: values.travelPreference,
            departureTime: values.departureTime,
            arrivalTime: values.arrivalTime
        })
      ]);

      if (itineraryResult) {
        setItinerary(itineraryResult);
      } else {
        throw new Error("The generated itinerary was empty.");
      }

      if (travelOptionsResult) {
        setTravelOptions(travelOptionsResult);
      } else {
        throw new Error("Could not get travel options.");
      }
    } catch (error) {
      console.error("Failed during generation:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      setError(`Sorry, we couldn't complete your request. ${errorMessage}`);
      toast({
        title: "Generation Failed",
        description: "There was a problem creating your trip plan.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const timeOptions = [
    { value: 'any', label: 'Any Time' },
    { value: 'morning', label: 'Morning (5AM-12PM)' },
    { value: 'afternoon', label: 'Afternoon (12PM-5PM)' },
    { value: 'evening', label: 'Evening (5PM-9PM)' },
    { value: 'night', label: 'Night (9PM-5AM)' },
  ];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
            <FormField
            control={form.control}
            name="origin"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Origin</FormLabel>
                <FormControl>
                    <Input placeholder="e.g., Mumbai" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="destination"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Destination</FormLabel>
                <FormControl>
                    <Input placeholder="e.g., Ahmedabad" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>
        <FormField
          control={form.control}
          name="tripDuration"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Duration (in days)</FormLabel>
              <FormControl>
                <Input type="number" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="interests"
          render={({ field }) => (
            <FormItem>
              <FormLabel>What are your interests?</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="e.g., A relaxing trip focused on beaches and local food"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid md:grid-cols-2 gap-4">
            <FormField
                control={form.control}
                name="departureTime"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Preferred Departure</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a time" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {timeOptions.map(option => (
                                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="arrivalTime"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Preferred Arrival</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a time" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {timeOptions.map(option => (
                                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )}
            />
        </div>
        <FormField
            control={form.control}
            name="travelPreference"
            render={({ field }) => (
                <FormItem>
                    <FormLabel>Travel Preference</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Select your travel priority" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            <SelectItem value="budget">Budget-Friendly</SelectItem>
                            <SelectItem value="comfort">Comfort</SelectItem>
                            <SelectItem value="speed">Fastest Route</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormMessage />
                </FormItem>
            )}
        />
        <Button type="submit" disabled={isLoading} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
          {isLoading ? (
            <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div> Generating...</>
          ) : (
            <><Wand2 className="mr-2 h-4 w-4" /> Generate Itinerary</>
          )}
        </Button>
      </form>
    </Form>
  );
}
