"use client";

import { useState } from "react";
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
  location: string;
};

export default function SuggestionModal({ currentPlan, location }: SuggestionModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<AdjustItineraryOutput | null>(null);
  const { toast } = useToast();

  const getSuggestion = async () => {
    if (!location) {
        toast({ title: "Location not available", description: "Cannot get suggestions without a location.", variant: "destructive" });
        return;
    }
    setIsLoading(true);
    setSuggestion(null);
    try {
      const result = await handleAdjustItinerary({
        currentPlan,
        location: location, // Use the destination city passed in props
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
          <DialogTitle>Need a New Plan?</DialogTitle>
          <DialogDescription>
            Let's check real-time conditions for your activity and suggest an alternative if needed.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <p className="text-sm"><strong>Current Plan:</strong> {currentPlan}</p>
          
          {isLoading && (
            <div className="flex items-center justify-center p-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="ml-4 text-muted-foreground">Checking conditions...</p>
            </div>
          )}

          {suggestion && (
            <div className={`mt-4 p-4 rounded-lg text-sm ${suggestion.isGoodToGo ? 'bg-green-100 dark:bg-green-900/50 text-green-900 dark:text-green-200' : 'bg-amber-100 dark:bg-amber-900/50 text-amber-900 dark:text-amber-200'}`}>
                <h4 className="font-bold mb-2">{suggestion.isGoodToGo ? "You're Good to Go!" : "Here's an Alternative:"}</h4>
                <p className="font-semibold">{suggestion.suggestion}</p>
                <p className="text-xs text-muted-foreground mt-2">{suggestion.reason}</p>
            </div>
          )}

        </div>
        <DialogFooter>
          <Button onClick={getSuggestion} disabled={isLoading}>
            {isLoading ? "Thinking..." : "Get Suggestion"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
