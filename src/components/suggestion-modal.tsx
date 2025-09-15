"use client";

import { useState, useEffect } from "react";
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
import { handleAdjustItinerary } from "@/app/actions";
import type { AdjustItineraryOutput } from "@/ai/flows/dynamically-adjust-itinerary";
import { useToast } from "@/hooks/use-toast";
import { Lightbulb } from "lucide-react";

type SuggestionModalProps = {
  currentPlan: string;
};

const mockWeatherData = {
  "rainy": "The weather is rainy.",
  "sunny": "The weather is sunny.",
  "cloudy": "The weather is cloudy.",
};
type WeatherCondition = keyof typeof mockWeatherData;

export default function SuggestionModal({ currentPlan }: SuggestionModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<AdjustItineraryOutput | null>(null);
  const [location, setLocation] = useState<{ city: string } | null>(null);
  const [weather, setWeather] = useState<WeatherCondition>("rainy");
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      setSuggestion(null);
      
      navigator.geolocation.getCurrentPosition(
        () => {
          setLocation({ city: "Ahmedabad" });
        },
        () => {
          toast({
            title: "Location Access Denied",
            description: "Using a default location for suggestions.",
            variant: "destructive",
          });
          setLocation({ city: "Ahmedabad" });
        }
      );
    }
  }, [isOpen, toast]);

  const getSuggestion = async () => {
    if (!location) {
        toast({ title: "Location not available", description: "Cannot get suggestions without a location.", variant: "destructive" });
        return;
    }
    setIsLoading(true);
    try {
      const result = await handleAdjustItinerary({
        currentPlan,
        location: location.city,
        weather: mockWeatherData[weather],
        userPreferences: "Culturally interesting indoor activities",
      });
      setSuggestion(result);
    } catch (error) {
      console.error("Failed to get suggestion:", error);
      toast({
        title: "Suggestion Failed",
        description: "Could not get a suggestion at this time.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="bg-accent hover:bg-accent/90 text-accent-foreground border-accent/30">
            <Lightbulb className="mr-2 h-4 w-4" />
            Smart Suggestion
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline">Need a new plan?</DialogTitle>
          <DialogDescription>
            Let's find an alternative based on real-time conditions.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <p className="text-sm"><strong>Current Plan:</strong> {currentPlan}</p>
          <p className="text-sm"><strong>Location:</strong> {location?.city || 'Fetching...'}</p>
          <div className="text-sm">
            <strong>Weather:</strong>
            <select
                value={weather}
                onChange={(e) => setWeather(e.target.value as WeatherCondition)}
                className="ml-2 p-1 border rounded-md bg-card"
                aria-label="Select weather condition"
            >
                {Object.keys(mockWeatherData).map(key => (
                    <option key={key} value={key}>{key.charAt(0).toUpperCase() + key.slice(1)}</option>
                ))}
            </select>
          </div>

          {isLoading && (
            <div className="flex items-center justify-center p-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          )}

          {suggestion && (
            <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                <h4 className="font-bold text-sm">New Suggestion:</h4>
                <p className="font-semibold text-primary">{suggestion.alternativeSuggestion}</p>
                <p className="text-sm text-muted-foreground mt-1">{suggestion.reason}</p>
            </div>
          )}

        </div>
        <DialogFooter>
          <Button onClick={getSuggestion} disabled={isLoading || !location}>
            {isLoading ? "Thinking..." : "Get Suggestion"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
