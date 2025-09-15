"use client";

import type { GeneratePersonalizedItineraryOutput } from "@/ai/flows/generate-personalized-itinerary";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import MapPlaceholder from "./map-placeholder";
import SuggestionModal from "./suggestion-modal";
import { ScrollArea } from "@/components/ui/scroll-area";
import React from "react";

interface Day {
  title: string;
  content: string;
}

const parseItinerary = (itineraryText: string): Day[] => {
  if (!itineraryText) return [];

  const days: Day[] = [];
  const dayRegex = /(Day\s*\d+.*)/gi;
  const parts = itineraryText.split(dayRegex).filter(part => part.trim() !== '');

  for (let i = 0; i < parts.length; i += 2) {
    if (parts[i] && parts[i+1]) {
      days.push({
        title: parts[i].trim().replace(/:$/, ''),
        content: parts[i+1].trim(),
      });
    }
  }
  
  if (days.length === 0 && itineraryText.length > 0) {
    return [{ title: "Your Itinerary", content: itineraryText }];
  }
  
  return days;
};

const ItineraryDisplay = ({ itineraryData }: { itineraryData: GeneratePersonalizedItineraryOutput }) => {
  const days = parseItinerary(itineraryData.itinerary);
  const firstActivity = days.length > 0 ? days[0].content.split('\n')[0] : "visit the city center";

  return (
    <Card className="h-[600px] flex flex-col shadow-lg">
      <CardHeader>
        <div className="flex justify-between items-start">
            <div>
                <CardTitle className="font-headline">Your Custom Itinerary</CardTitle>
                <CardDescription>Here is your personalized plan.</CardDescription>
            </div>
            <SuggestionModal currentPlan={firstActivity} />
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-4 overflow-hidden">
        <div className="h-48 rounded-lg overflow-hidden border">
          <MapPlaceholder />
        </div>
        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6">
            {days.map((day, index) => (
              <div key={index}>
                <h3 className="font-headline text-lg font-semibold mb-2">{day.title}</h3>
                <div className="space-y-2 text-sm text-muted-foreground whitespace-pre-line">
                  {day.content}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default ItineraryDisplay;
