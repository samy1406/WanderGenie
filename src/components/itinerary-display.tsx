"use client";

import type { GeneratePersonalizedItineraryOutput } from "@/ai/flows/generate-personalized-itinerary";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import MapPlaceholder from "./map-placeholder";
import SuggestionModal from "./suggestion-modal";
import { ScrollArea } from "@/components/ui/scroll-area";
import React from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion";
import { CheckCircle2, Hand, Backpack, Info, CheckSquare } from "lucide-react";

const ItineraryDisplay = ({ itineraryData, destination }: { itineraryData: GeneratePersonalizedItineraryOutput, destination: string }) => {
  const { dailyPlan, thingsToCarry, mustDo, travelTips } = itineraryData;
  const firstActivity = dailyPlan.length > 0 && dailyPlan[0].activities.length > 0 ? dailyPlan[0].activities[0] : "visit the city center";

  return (
    <Card className="h-full flex flex-col shadow-lg border-primary/20">
      <CardHeader className="bg-primary/5">
        <div className="flex justify-between items-start">
            <div>
                <CardTitle className="font-headline text-3xl text-primary">Your Custom Itinerary</CardTitle>
                <CardDescription>A personalized plan for your trip to {destination}.</CardDescription>
            </div>
            <SuggestionModal currentPlan={firstActivity} />
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-4 overflow-hidden pt-6">
        <div className="h-48 rounded-lg overflow-hidden border">
          <MapPlaceholder destination={destination} />
        </div>
        <ScrollArea className="flex-1 pr-4">
          <Accordion type="single" collapsible defaultValue="day-0">
            {dailyPlan.map((day, index) => (
              <AccordionItem key={index} value={`day-${index}`}>
                <AccordionTrigger className="font-headline text-lg font-semibold hover:text-primary">Day {day.day}: {day.title}</AccordionTrigger>
                <AccordionContent>
                  <ul className="space-y-3 text-sm text-muted-foreground">
                    {day.activities.map((activity, actIndex) => (
                        <li key={actIndex} className="flex items-start">
                            <CheckSquare className="mr-2 mt-1 h-4 w-4 flex-shrink-0 text-accent" />
                            <span>{activity}</span>
                        </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg font-headline">
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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg font-headline">
                  <Hand className="mr-2 h-5 w-5 text-primary" />
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
