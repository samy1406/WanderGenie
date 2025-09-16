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
import { Lightbulb, Sun, Cloud, CloudRain } from "lucide-react";

type SuggestionModalProps = {
  currentPlan: string;
};

const weatherOptions = {
  sunny: { label: "Sunny", icon: <Sun className="h-4 w-4 text-yellow-500" />, data: "The weather is sunny and clear." },
  cloudy: { label: "Cloudy", icon: <Cloud className="h-4 w-4 text-gray-500" />, data: "The weather is cloudy." },
  rainy: { label: "Rainy", icon: <CloudRain className="h-4 w-4 text-blue-500" />, data: "It is currently raining." },
};
type WeatherCondition = keyof typeof weatherOptions;

export default function SuggestionModal({ currentPlan }: SuggestionModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<AdjustItineraryOutput | null>(null);
  const [location, setLocation] = useState<{ city: string } | null>(null);
  const [weather, setWeather] = useState<WeatherCondition>("sunny");
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
        weather: weatherOptions[weather].data,
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
        <Button variant="outline" className="bg-accent hover:bg-accent/90 text-accent-foreground border-accent/30 shadow-sm">
            <Lightbulb className="mr-2 h-4 w-4" />
            Smart Suggestion
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline">Need a New Plan?</DialogTitle>
          <DialogDescription>
            Let's check for potential hurdles and find an alternative if needed.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <p className="text-sm"><strong>Current Plan:</strong> {currentPlan}</p>
          <p className="text-sm"><strong>Location:</strong> {location?.city || 'Fetching...'}</p>
          <div className="text-sm">
            <label htmlFor="weather-select" className="font-bold">Select Current Weather:</label>
            <div className="flex items-center gap-2 mt-2">
                 <select
                    id="weather-select"
                    value={weather}
                    onChange={(e) => setWeather(e.target.value as WeatherCondition)}
                    className="flex-grow p-2 border rounded-md bg-card"
                    aria-label="Select weather condition"
                >
                    {Object.keys(weatherOptions).map(key => (
                        <option key={key} value={key}>{weatherOptions[key as WeatherCondition].label}</option>
                    ))}
                </select>
                {weatherOptions[weather].icon}
            </div>
          </div>

          {isLoading && (
            <div className="flex items-center justify-center p-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          )}

          {suggestion && (
            <div className={`mt-4 p-4 rounded-lg ${suggestion.isGoodToGo ? 'bg-green-100 dark:bg-green-900/50' : 'bg-amber-100 dark:bg-amber-900/50'}`}>
                <h4 className="font-bold text-sm">{suggestion.isGoodToGo ? "You're Good to Go!" : "Here's an Alternative:"}</h4>
                <p className={`font-semibold ${suggestion.isGoodToGo ? 'text-green-700 dark:text-green-300' : 'text-amber-700 dark:text-amber-300'}`}>{suggestion.suggestion}</p>
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
