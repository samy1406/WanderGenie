"use client";

import type { GeneratePersonalizedItineraryOutput } from "@/ai/flows/generate-personalized-itinerary";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import MapPlaceholder from "./map-placeholder";
import SuggestionModal from "./suggestion-modal";
import { ScrollArea } from "@/components/ui/scroll-area";
import React from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion";
import { Button } from "./ui/button";
import { CheckCircle2, Hand, Backpack, Info, CheckSquare, MapPin, Rocket } from "lucide-react";

const ItineraryDisplay = ({ itineraryData, destination }: { itineraryData: GeneratePersonalizedItineraryOutput, destination: string }) => {
  const { dailyPlan, thingsToCarry, mustDo, travelTips } = itineraryData;
  const firstActivity = dailyPlan.length > 0 && dailyPlan[0].activities.length > 0 ? dailyPlan[0].activities[0] : "visit the city center";

  const handleStartJourney = () => {
    // In a real application, this would trigger location tracking.
    // For now, we'll just log to the console.
    console.log("Journey started! (Simulated)");
    alert("Journey started! In a real app, we would now track your progress against the itinerary.");
  };

  return (
    <Card className="h-full flex flex-col shadow-lg border-primary/20 bg-card">
      <CardHeader className="bg-primary/10">
        <div className="flex justify-between items-start gap-4">
            <div>
                <CardTitle className="text-3xl text-primary">Your Trip to {destination}</CardTitle>
                <CardDescription>A personalized plan for your adventure.</CardDescription>
            </div>
            <div className="flex gap-2 flex-shrink-0">
                <SuggestionModal currentPlan={firstActivity} location={destination} />
                <Button onClick={handleStartJourney}>
                    <Rocket className="mr-2 h-4 w-4" /> Start Journey
                </Button>
            </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-4 overflow-hidden pt-6">
        <div className="h-48 rounded-lg overflow-hidden border shadow-inner">
          <MapPlaceholder destination={destination} />
        </div>
        <ScrollArea className="flex-1 pr-4 -mr-4">
          <Accordion type="single" collapsible defaultValue="day-0" className="pr-4">
            {dailyPlan.map((day, index) => (
              <AccordionItem key={index} value={`day-${index}`} className="border-b-2 border-primary/10">
                <AccordionTrigger className="font-headline text-xl font-bold hover:text-primary py-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary text-primary-foreground rounded-full h-8 w-8 flex items-center justify-center font-body text-sm">
                      {day.day}
                    </div>
                    {day.title}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pl-4 border-l-2 border-accent ml-4">
                  <ul className="space-y-3 text-sm text-foreground/80">
                    {day.activities.map((activity, actIndex) => (
                        <li key={actIndex} className="flex items-start">
                            <CheckSquare className="mr-3 mt-1 h-4 w-4 flex-shrink-0 text-accent" />
                            <span>{activity}</span>
                        </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <Card className="bg-secondary/50">
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Backpack className="mr-2 h-5 w-5 text-primary" />
                  Things to Carry
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {thingsToCarry.map((item, index) => (
                    <li key={index} className="flex items-center">
                      <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            <Card className="bg-secondary/50">
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <MapPin className="mr-2 h-5 w-5 text-primary" />
                  Must-Do Activities
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {mustDo.map((item, index) => (
                    <li key={index} className="flex items-start">
                       <CheckCircle2 className="mr-2 mt-1 h-4 w-4 flex-shrink-0 text-green-500" />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter>
        <div className="text-xs text-muted-foreground p-4 bg-muted/50 rounded-lg flex items-start w-full">
          <Info className="mr-2 h-4 w-4 flex-shrink-0 text-primary" />
          <div>
            <span className="font-semibold">Travel Tip:</span> {travelTips}
          </div>
        </div>
      </CardFooter>
    </Card>
  );
};

export default ItineraryDisplay;
