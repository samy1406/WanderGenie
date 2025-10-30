
"use client";

import type { GeneratePersonalizedItineraryOutput } from "@/ai/flows/generate-personalized-itinerary";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import LiveMap from "./live-map";
import SuggestionModal from "./suggestion-modal";
import { ScrollArea } from "@/components/ui/scroll-area";
import React, { useState } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion";
import { Button } from "./ui/button";
import { CheckCircle2, Backpack, Info, CheckSquare, MapPin, Rocket, StopCircle, Building, Utensils, BusFront, IndianRupee, Link, Bot } from "lucide-react";
import { Separator } from "./ui/separator";
import { useToast } from "@/hooks/use-toast";
import { FormatBoldText } from "./format-bold-text";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/formatters";
import type { User } from '@/context/auth-context';

type Activity = GeneratePersonalizedItineraryOutput['dailyPlan'][0]['activities'][0];

const ItineraryDisplay = ({ itineraryData, destination, origin, onItineraryUpdate, user }: { 
  itineraryData: GeneratePersonalizedItineraryOutput, 
  destination: string, 
  origin: string,
  onItineraryUpdate: (newItinerary: GeneratePersonalizedItineraryOutput) => void,
  user: User | null
}) => {
  const { dailyPlan, thingsToCarry, mustDo, travelTips, estimatedCost } = itineraryData;
  const firstActivity = dailyPlan.length > 0 && dailyPlan[0].activities.length > 0 ? dailyPlan[0].activities[0].description : "visit the city center";
  
  const [journeyStarted, setJourneyStarted] = useState(false);
  const [simulationStarted, setSimulationStarted] = useState(false);
  const [activeDay, setActiveDay] = useState<string | undefined>(undefined);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);

  const handleToggleJourney = () => {
    const isStarting = !journeyStarted;
    setJourneyStarted(isStarting);

    if (isStarting) {
      if (dailyPlan.length > 0) {
        setActiveDay("day-0");
        if (dailyPlan[0].activities.length > 0) {
            setSelectedActivity(dailyPlan[0].activities[0]);
        }
      }
      console.log("Journey started!");
    } else {
      setActiveDay(undefined);
      setSelectedActivity(null);
      console.log("Journey ended.");
    }
  };

  const handleToggleSimulation = () => {
    setSimulationStarted(prev => !prev);
  }

  const handleSuggestionAccepted = (newActivityDescription: string) => {
    const newItinerary = JSON.parse(JSON.stringify(itineraryData));
    
    if (newItinerary.dailyPlan.length > 0 && newItinerary.dailyPlan[0].activities.length > 0) {
      const firstDayActivities = newItinerary.dailyPlan[0].activities;
      const updatedActivity = {
        ...firstDayActivities[0],
        description: newActivityDescription,
        location: newActivityDescription.split('**')[1] || newActivityDescription
      };
      
      firstDayActivities[0] = updatedActivity;
      
      if (selectedActivity?.description === firstActivity) {
        setSelectedActivity(updatedActivity);
      }

      onItineraryUpdate(newItinerary);
    }
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
                {user?.email === 'admin@wandergenie.com' && (
                  <Button variant="secondary" onClick={handleToggleSimulation}>
                    <Bot className="mr-2 h-4 w-4" />
                    {simulationStarted ? "End Simulation" : "Simulate Journey"}
                  </Button>
                )}
                {journeyStarted && <SuggestionModal currentPlan={firstActivity} location={destination} onSuggestionAccepted={handleSuggestionAccepted} />}
                <Button onClick={handleToggleJourney}>
                    {journeyStarted ? (
                        <><StopCircle className="mr-2 h-4 w-4" /> End Journey</>
                    ) : (
                        <><Rocket className="mr-2 h-4 w-4" /> Start Journey</>
                    )}
                </Button>
            </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-4 overflow-hidden pt-6">
        <div className="h-64 rounded-lg overflow-hidden border shadow-inner">
            <LiveMap 
                destination={destination} 
                origin={origin} 
                journeyStarted={journeyStarted} 
                simulationStarted={simulationStarted}
                selectedActivity={selectedActivity}
                itineraryData={itineraryData}
            />
        </div>
        <ScrollArea className="flex-1 pr-4 -mr-4">
          <Accordion 
            type="single" 
            collapsible 
            value={activeDay} 
            onValueChange={setActiveDay} 
            className="pr-4"
          >
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
                  <ul className="space-y-1 text-sm text-foreground/80">
                    {day.activities.map((activity, actIndex) => (
                        <li key={actIndex} 
                            onClick={() => journeyStarted && setSelectedActivity(activity)}
                            className={cn(
                                "flex items-start p-2 rounded-md transition-colors",
                                journeyStarted && "cursor-pointer hover:bg-primary/10",
                                selectedActivity?.description === activity.description && journeyStarted && "bg-primary/20"
                            )}
                        >
                            <MapPin className={cn(
                                "mr-3 mt-1 h-4 w-4 flex-shrink-0 text-accent",
                                selectedActivity?.description === activity.description && journeyStarted && "text-primary animate-pulse"
                                )} />
                            <span className="flex-1">
                                <FormatBoldText text={activity.description} />
                                <a href={activity.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-primary/80 hover:text-primary ml-2">
                                    <Link className="h-3 w-3 mr-1" />
                                </a>
                            </span>
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
                    <IndianRupee className="mr-2 h-5 w-5 text-primary" />
                    Estimated Trip Cost
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 text-sm">
                    <div className="text-center pb-4 flex items-center justify-center">
                      <IndianRupee className="h-6 w-6 mr-1 text-primary"/>
                      <p className="text-2xl font-bold text-primary">{formatCurrency(estimatedCost.total)}</p>
                    </div>
                     <p className="text-xs text-muted-foreground text-center -mt-4 mb-2">(approx. for your preferences)</p>
                    <Separator />
                    <div className="space-y-3 text-muted-foreground pt-2">
                        <div className="flex justify-between items-center">
                            <div className="flex gap-4">
                                <Building className="h-5 w-5 mt-1 text-primary/70 flex-shrink-0" /> 
                                <p className="font-semibold text-foreground">Accommodation</p>
                            </div>
                            <div className="flex items-center">
                               <IndianRupee className="h-4 w-4 mr-1"/>
                               <p>{formatCurrency(estimatedCost.accommodation)}</p>
                            </div>
                        </div>
                         <div className="flex justify-between items-center">
                            <div className="flex gap-4">
                                <Utensils className="h-5 w-5 mt-1 text-primary/70 flex-shrink-0" /> 
                                <p className="font-semibold text-foreground">Food</p>
                            </div>
                            <div className="flex items-center">
                               <IndianRupee className="h-4 w-4 mr-1"/>
                               <p>{formatCurrency(estimatedCost.food)}</p>
                            </div>
                        </div>
                         <div className="flex justify-between items-center">
                             <div className="flex gap-4">
                                <BusFront className="h-5 w-5 mt-1 text-primary/70 flex-shrink-0" /> 
                                <p className="font-semibold text-foreground">Local Transport</p>
                            </div>
                             <div className="flex items-center">
                               <IndianRupee className="h-4 w-4 mr-1"/>
                               <p>{formatCurrency(estimatedCost.localTransport)}</p>
                            </div>
                        </div>
                    </div>
                  </div>
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
                      <FormatBoldText text={item} />
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            <Card className="bg-secondary/50 md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Backpack className="mr-2 h-5 w-5 text-primary" />
                  Things to Carry
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground grid md:grid-cols-2">
                  {thingsToCarry.map((item, index) => (
                    <li key={index} className="flex items-center">
                      <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
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

    