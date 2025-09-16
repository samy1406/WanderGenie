"use client";

import type { GeneratePersonalizedItineraryOutput } from "@/ai/flows/generate-personalized-itinerary";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import MapPlaceholder from "./map-placeholder";
import SuggestionModal from "./suggestion-modal";
import { ScrollArea } from "@/components/ui/scroll-area";
import React from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion";

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

const ItineraryDisplay = ({ itineraryData, destination }: { itineraryData: GeneratePersonalizedItineraryOutput, destination: string }) => {
  const days = parseItinerary(itineraryData.itinerary);
  const firstActivity = days.length > 0 ? days[0].content.split('\n')[0] : "visit the city center";

  return (
    <Card className="h-full flex flex-col shadow-lg">
      <CardHeader>
        <div className="flex justify-between items-start">
            <div>
                <CardTitle className="font-headline text-3xl">Your Custom Itinerary</CardTitle>
                <CardDescription>A personalized plan for your trip to {destination}.</CardDescription>
            </div>
            <SuggestionModal currentPlan={firstActivity} />
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-4 overflow-hidden">
        <div className="h-48 rounded-lg overflow-hidden border">
          <MapPlaceholder destination={destination} />
        </div>
        <ScrollArea className="flex-1 pr-4">
          <Accordion type="single" collapsible defaultValue="day-0">
            {days.map((day, index) => (
              <AccordionItem key={index} value={`day-${index}`}>
                <AccordionTrigger className="font-headline text-lg font-semibold">{day.title}</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2 text-sm text-muted-foreground whitespace-pre-line">
                    {day.content}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default ItineraryDisplay;
