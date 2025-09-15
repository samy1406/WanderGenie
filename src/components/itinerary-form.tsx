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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { handleGenerateItinerary } from "@/app/actions";
import type { GeneratePersonalizedItineraryOutput } from "@/ai/flows/generate-personalized-itinerary";
import { useToast } from "@/hooks/use-toast";
import { Wand2 } from "lucide-react";

const formSchema = z.object({
  destination: z.string().min(2, "Destination must be at least 2 characters."),
  tripDuration: z.coerce.number().min(1, "Duration must be at least 1 day.").max(14, "Duration cannot exceed 14 days."),
  interests: z.string().min(10, "Tell us a bit more about your interests."),
});

type ItineraryFormProps = {
  setItinerary: Dispatch<SetStateAction<GeneratePersonalizedItineraryOutput | null>>;
  setIsLoading: Dispatch<SetStateAction<boolean>>;
  setError: Dispatch<SetStateAction<string | null>>;
  isLoading: boolean;
};

export default function ItineraryForm({ setItinerary, setIsLoading, setError, isLoading }: ItineraryFormProps) {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      destination: "",
      tripDuration: 3,
      interests: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setError(null);
    setItinerary(null);
    try {
      const result = await handleGenerateItinerary(values);
      if (result) {
        setItinerary(result);
      } else {
        throw new Error("The generated itinerary was empty.");
      }
    } catch (error) {
      console.error("Failed to generate itinerary:", error);
      setError("Sorry, we couldn't generate your itinerary. Please try again.");
      toast({
        title: "Generation Failed",
        description: "There was a problem creating your trip plan.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
