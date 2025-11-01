
"use client";

import type { GeneratePersonalizedItineraryOutput } from "@/ai/flows/generate-personalized-itinerary";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import LiveMap from "./live-map";
import SuggestionModal from "./suggestion-modal";
import { ScrollArea } from "@/components/ui/scroll-area";
import React, { useState, useMemo, useEffect } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion";
import { Button } from "./ui/button";
import { CheckCircle2, Backpack, Info, MapPin, Rocket, StopCircle, Building, Utensils, BusFront, IndianRupee, Link, Bot, Save, Clock, Sunrise, Sun, Sunset, Moon } from "lucide-react";
import { Separator } from "./ui/separator";
import { useToast } from "@/hooks/use-toast";
import { FormatBoldText } from "./format-bold-text";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/formatters";
import type { User } from '@/context/auth-context';
import { useAuth } from "@/context/auth-context";
import { addDays, format } from 'date-fns';
import { AdminPanel } from "./admin-panel";

type Activity = NonNullable<GeneratePersonalizedItineraryOutput['dailyPlan'][0]['morning']>[0];

const allActivities = (dailyPlan: GeneratePersonalizedItineraryOutput['dailyPlan']) =>
  dailyPlan.flatMap(day => [
    ...(day.morning || []),
    ...(day.afternoon || []),
    ...(day.evening || []),
    ...(day.night || [])
  ]);

const ActivityList = ({ activities, journeyStarted, selectedActivity, onActivitySelect }: { activities: Activity[], journeyStarted: boolean, selectedActivity: Activity | null, onActivitySelect: (activity: Activity) => void }) => {
  if (!activities || activities.length === 0) return null;

  return (
    <ul className="space-y-1 text-sm text-foreground/80">
      {activities.map((activity, actIndex) => (
        <li key={actIndex}
          onClick={() => journeyStarted && onActivitySelect(activity)}
          className={cn(
            "p-2 rounded-md transition-colors",
            journeyStarted && "cursor-pointer hover:bg-primary/10",
            selectedActivity?.description === activity.description && journeyStarted && "bg-primary/20"
          )}
        >
          <div className="flex items-start">
             <MapPin className={cn(
                "mr-3 mt-1 h-4 w-4 flex-shrink-0 text-accent",
                selectedActivity?.description === activity.description && journeyStarted && "text-primary animate-pulse"
                )} />
             <div className="flex-1">
                <div className="flex justify-between items-center">
                    <span className="font-semibold"><FormatBoldText text={activity.description} /></span>
                    <span className="text-xs text-muted-foreground flex items-center"><Clock className="mr-1 h-3 w-3"/>{activity.startTime} - {activity.endTime}</span>
                </div>
                 <a href={activity.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-primary/80 hover:text-primary text-xs">
                    <Link className="h-3 w-3 mr-1" /> View on Map
                </a>
             </div>
          </div>
          {activity.travelInfo && (
            <p className="pl-7 mt-1 text-xs text-muted-foreground italic border-l-2 border-dashed border-accent ml-2 pl-3">{activity.travelInfo}</p>
          )}
        </li>
      ))}
    </ul>
  );
};


const ItineraryDisplay = ({ itineraryData, destination, origin, onItineraryUpdate, onSaveTrip, showSaveButton = true, isSaved = false, departureDate }: { 
  itineraryData: GeneratePersonalizedItineraryOutput, 
  destination: string, 
  origin: string,
  onItineraryUpdate: (newItinerary: GeneratePersonalizedItineraryOutput) => void,
  onSaveTrip?: () => void,
  showSaveButton?: boolean,
  isSaved?: boolean,
  departureDate: Date,
}) => {

  if (!itineraryData || !itineraryData.dailyPlan || itineraryData.dailyPlan.length === 0) {
    return (
        <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">Itinerary data is not available.</p>
        </div>
    );
  }

  const { dailyPlan, thingsToCarry, mustDo, travelTips, estimatedCost } = itineraryData;
  const firstActivityDescription = dailyPlan[0]?.morning?.[0]?.description ?? dailyPlan[0]?.afternoon?.[0]?.description ?? "visit the city center";
  const { user } = useAuth();
  
  const [journeyStarted, setJourneyStarted] = useState(false);
  const [simulationStarted, setSimulationStarted] = useState(false);
  const [activeDay, setActiveDay] = useState<string | undefined>("day-0");
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);

  const itineraryCheckpoints = useMemo(() => allActivities(dailyPlan), [dailyPlan]);
  const [currentCheckpointIndex, setCurrentCheckpointIndex] = useState(0);

  useEffect(() => {
    if (journeyStarted) {
      // Set the first activity when journey starts
      const firstActivity = itineraryCheckpoints[0];
      if (firstActivity) {
        setSelectedActivity(firstActivity);
        setCurrentCheckpointIndex(0);
        // Also expand the corresponding accordion
        const dayOfFirstActivity = dailyPlan.findIndex(day => 
            allActivities([day]).some(act => act.description === firstActivity.description)
        );
        if (dayOfFirstActivity !== -1) {
            setActiveDay(`day-${dayOfFirstActivity}`);
        }
      }
    } else {
      // Reset when journey ends
      setSelectedActivity(null);
      setCurrentCheckpointIndex(0);
    }
  }, [journeyStarted, itineraryCheckpoints, dailyPlan]);

  const handleSelectActivity = (activity: Activity) => {
    setSelectedActivity(activity);
    const activityIndex = itineraryCheckpoints.findIndex(
      (act) => act.description === activity.description
    );
    if (activityIndex !== -1) {
      setCurrentCheckpointIndex(activityIndex);
    }
  };

  const handleToggleJourney = () => {
    setJourneyStarted(isStarting => !isStarting);
  };

  const handleToggleSimulation = () => {
    setSimulationStarted(prev => !prev);
  }

  const handleSuggestionAccepted = (newActivityDescription: string) => {
    if (!selectedActivity) return;

    const newItinerary = JSON.parse(JSON.stringify(itineraryData));
    
    let activityFoundAndReplaced = false;
    for (const day of newItinerary.dailyPlan) {
        for (const timeSlot of ['morning', 'afternoon', 'evening', 'night']) {
            if ((day as any)[timeSlot]) {
                const actIndex = (day as any)[timeSlot].findIndex((act: Activity) => act.description === selectedActivity.description);
                if (actIndex !== -1) {
                    const updatedActivity = {
                        ...(day as any)[timeSlot][actIndex],
                        description: newActivityDescription,
                        location: newActivityDescription.split('**')[1] || newActivityDescription
                    };
                    (day as any)[timeSlot][actIndex] = updatedActivity;
                    setSelectedActivity(updatedActivity);
                    activityFoundAndReplaced = true;
                    break;
                }
            }
        }
        if (activityFoundAndReplaced) break;
    }

    if (activityFoundAndReplaced) {
        onItineraryUpdate(newItinerary);
    }
  };
  
  const handleNextCheckpoint = () => {
    const nextIndex = currentCheckpointIndex + 1;
    if (nextIndex < itineraryCheckpoints.length) {
      setCurrentCheckpointIndex(nextIndex);
      const nextActivity = itineraryCheckpoints[nextIndex];
      setSelectedActivity(nextActivity);
      
      const dayOfNextActivity = dailyPlan.findIndex(day => 
        allActivities([day]).some(act => act.description === nextActivity.description)
      );
      if (dayOfNextActivity !== -1) {
        setActiveDay(`day-${dayOfNextActivity}`);
      }
    } else {
        // Reached end of trip
        setSelectedActivity(null);
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
                {showSaveButton && onSaveTrip && (
                    <Button variant="secondary" onClick={onSaveTrip} disabled={isSaved}>
                        <Save className="mr-2 h-4 w-4" />
                        {isSaved ? "Trip Saved" : "Save Trip"}
                    </Button>
                )}
                {user?.email === 'admin@wandergenie.com' && (
                  <Button variant="secondary" onClick={handleToggleSimulation}>
                    <Bot className="mr-2 h-4 w-4" />
                    {simulationStarted ? "End Simulation" : "Simulate Journey"}
                  </Button>
                )}
                {journeyStarted && <SuggestionModal currentPlan={selectedActivity?.description || firstActivityDescription} location={destination} onSuggestionAccepted={handleSuggestionAccepted} />}
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
      <CardContent className="flex-1 flex flex-col gap-4 overflow-hidden pt-6 relative">
       {simulationStarted && journeyStarted && user?.email === 'admin@wandergenie.com' && (
          <AdminPanel
            nextCheckpoint={itineraryCheckpoints[currentCheckpointIndex] || null}
            onNext={handleNextCheckpoint}
          />
        )}
        <div className="h-64 rounded-lg overflow-hidden border shadow-inner">
             <LiveMap 
                destination={destination} 
                origin={origin} 
                journeyStarted={journeyStarted}
                selectedActivity={selectedActivity}
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
            {dailyPlan.map((day, index) => {
              const currentDate = addDays(departureDate, index);
              const formattedDate = format(currentDate, "MMMM d, yyyy");
              const dayOfWeek = format(currentDate, "EEEE");

              return (
              <AccordionItem key={index} value={`day-${index}`} className="border-b-2 border-primary/10">
                <AccordionTrigger className="font-headline text-xl font-bold hover:text-primary py-4 text-left">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary text-primary-foreground rounded-full h-8 w-8 flex items-center justify-center font-body text-sm flex-shrink-0">
                      {day.day}
                    </div>
                    <div>
                      <span>{day.title}</span>
                      <p className="text-sm font-normal text-muted-foreground">{formattedDate}, {dayOfWeek}</p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pl-4 border-l-2 border-accent ml-4 space-y-4">
                  
                  {day.morning && day.morning.length > 0 && (
                    <div className="space-y-2">
                        <h4 className="font-semibold flex items-center text-muted-foreground"><Sunrise className="mr-2 h-4 w-4" /> Morning</h4>
                        <ActivityList activities={day.morning} journeyStarted={journeyStarted} selectedActivity={selectedActivity} onActivitySelect={handleSelectActivity} />
                    </div>
                  )}

                  {day.afternoon && day.afternoon.length > 0 && (
                     <div className="space-y-2">
                        <h4 className="font-semibold flex items-center text-muted-foreground"><Sun className="mr-2 h-4 w-4" /> Afternoon</h4>
                        <ActivityList activities={day.afternoon} journeyStarted={journeyStarted} selectedActivity={selectedActivity} onActivitySelect={handleSelectActivity} />
                    </div>
                  )}

                   {day.evening && day.evening.length > 0 && (
                     <div className="space-y-2">
                        <h4 className="font-semibold flex items-center text-muted-foreground"><Sunset className="mr-2 h-4 w-4" /> Evening</h4>
                        <ActivityList activities={day.evening} journeyStarted={journeyStarted} selectedActivity={selectedActivity} onActivitySelect={handleSelectActivity} />
                    </div>
                  )}
                  
                  {day.night && day.night.length > 0 && (
                     <div className="space-y-2">
                        <h4 className="font-semibold flex items-center text-muted-foreground"><Moon className="mr-2 h-4 w-4" /> Night</h4>
                        <ActivityList activities={day.night} journeyStarted={journeyStarted} selectedActivity={selectedActivity} onActivitySelect={handleSelectActivity} />
                    </div>
                  )}

                </AccordionContent>
              </AccordionItem>
            )})}
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