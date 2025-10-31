
// src/components/trip-planner.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import ItineraryForm, { formSchema } from "@/components/itinerary-form";
import ItineraryDisplay from "@/components/itinerary-display";
import TravelOptions from "@/components/travel-options";
import type { GeneratePersonalizedItineraryOutput } from "@/ai/flows/generate-personalized-itinerary";
import type { GetTravelOptionsOutput } from "@/ai/flows/get-travel-options";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { handleGenerateItinerary, handleGetTravelOptions } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
import { HeroSection } from "./hero-section";
import { AuthModal } from "./auth-modal";
import { addDays } from 'date-fns';
import { useAuth } from "@/context/auth-context";
import { useTrip } from "@/context/trip-context";
import { Button } from "./ui/button";
import { Ticket } from "lucide-react";

export type TripType = "oneway" | "roundtrip";
type ViewState = 'PLAN' | 'BOOK';

export function TripPlanner() {
  const { toast } = useToast();
  const { isAuthenticated, user, openAuthModal } = useAuth();
  const { trips, addTrip, getTrip, selectedTrip, setSelectedTrip } = useTrip();

  const [itinerary, setItinerary] = useState<GeneratePersonalizedItineraryOutput | null>(null);
  const [outboundTravelOptions, setOutboundTravelOptions] = useState<GetTravelOptionsOutput | null>(null);
  const [returnTravelOptions, setReturnTravelOptions] = useState<GetTravelOptionsOutput | null>(null);
  const [destination, setDestination] = useState<string | null>(null);
  const [origin, setOrigin] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tripType, setTripType] = useState<TripType>("oneway");
  const [viewState, setViewState] = useState<ViewState>('PLAN');

  const resultsRef = useRef<HTMLDivElement>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      origin: "Ahmedabad",
      destination: "Mumbai",
      departureDate: new Date(),
      returnDate: undefined,
      tripDuration: 3,
      interests: "Historical sites and local food",
      travelPreference: "budget",
      departureTime: "any",
      arrivalTime: "any",
      tripType: "oneway",
    },
  });

  useEffect(() => {
    if (selectedTrip) {
        setItinerary(selectedTrip.itinerary);
        setDestination(selectedTrip.destination);
        setOrigin(selectedTrip.origin);

        const departureDate = new Date(selectedTrip.createdAt);
        const isRoundTrip = selectedTrip.itinerary.dailyPlan.length > 1;

        form.reset({
            origin: selectedTrip.origin,
            destination: selectedTrip.destination,
            tripDuration: selectedTrip.itinerary.dailyPlan.length,
            interests: selectedTrip.itinerary.travelTips,
            travelPreference: selectedTrip.itinerary.estimatedCost.total < 20000 ? 'budget' : 'comfort',
            departureDate: departureDate,
            returnDate: isRoundTrip ? addDays(departureDate, selectedTrip.itinerary.dailyPlan.length) : undefined,
            tripType: isRoundTrip ? 'roundtrip' : 'oneway',
        });
        setTripType(isRoundTrip ? 'roundtrip' : 'oneway');

        // Since we are loading a plan, reset booking options and view
        setOutboundTravelOptions(null);
        setReturnTravelOptions(null);
        setViewState('PLAN');

        setSelectedTrip(null);
    }
}, [selectedTrip, setSelectedTrip, form]);


  // Update tripType in form when it changes using useEffect
  useEffect(() => {
    form.setValue("tripType", tripType);
    if(tripType === 'oneway') {
      form.setValue('returnDate', undefined);
    } else {
        // When switching to roundtrip, set a default return date if not already set
        if (!form.getValues('returnDate')) {
            const departure = form.getValues('departureDate');
            form.setValue('returnDate', addDays(departure || new Date(), 3));
        }
    }
  }, [tripType, form]);


  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setError(null);
    setItinerary(null);
    setOutboundTravelOptions(null);
    setReturnTravelOptions(null);
    setViewState('PLAN'); // Default to plan view first
    
    setDestination(values.destination);
    setOrigin(values.origin);
    
    try {
      const itineraryPromise = handleGenerateItinerary({
        destination: values.destination,
        tripDuration: values.tripDuration,
        interests: values.interests,
        travelPreference: values.travelPreference,
        arrivalTime: values.arrivalTime,
      });

      const outboundOptionsPromise = handleGetTravelOptions({
          origin: values.origin,
          destination: values.destination,
          travelPreference: values.travelPreference,
          departureTime: values.departureTime,
          arrivalTime: values.arrivalTime
      });
      
      const promises: Promise<any>[] = [itineraryPromise, outboundOptionsPromise];

      if (values.tripType === 'roundtrip') {
          const returnOptionsPromise = handleGetTravelOptions({
              origin: values.destination, // Swap origin and destination
              destination: values.origin,
              travelPreference: values.travelPreference,
              departureTime: values.departureTime,
              arrivalTime: values.arrivalTime
          });
          promises.push(returnOptionsPromise);
      }

      const [itineraryResult, outboundOptionsResult, returnOptionsResult] = await Promise.all(promises);

      if (itineraryResult) {
        setItinerary(itineraryResult);
      } else {
        throw new Error("The generated itinerary was empty.");
      }

      if (outboundOptionsResult) {
        setOutboundTravelOptions(outboundOptionsResult);
      } else {
        throw new Error("Could not get outbound travel options.");
      }

      if (values.tripType === 'roundtrip' && returnOptionsResult) {
          setReturnTravelOptions(returnOptionsResult as GetTravelOptionsOutput);
      }

    } catch (error) {
      console.error("Failed during generation:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      setError(`Sorry, we couldn't complete your request. ${errorMessage}`);
      toast({
        title: "Generation Failed",
        description: "There was a problem creating your trip plan.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      // Scroll to results after a short delay to allow rendering
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }

  const handleHotelBooking = (hotelName: string) => {
    if (!itinerary || !destination) return;
  
    // Create a deep copy to avoid direct state mutation
    const newItinerary = JSON.parse(JSON.stringify(itinerary));
  
    // Smartly find and replace or add the check-in activity
    let activityReplaced = false;

    for (const day of newItinerary.dailyPlan) {
        for (const timeSlot of ['morning', 'afternoon', 'evening', 'night']) {
            if (day[timeSlot]) {
                const accommodationActivityIndex = day[timeSlot].findIndex((activity: any) =>
                    activity.description.toLowerCase().includes('accommodation') ||
                    activity.description.toLowerCase().includes('hotel')
                );
                
                if (accommodationActivityIndex !== -1) {
                    day[timeSlot][accommodationActivityIndex].description = `Check into **${hotelName}**`;
                    day[timeSlot][accommodationActivityIndex].location = `${hotelName}, ${destination}`;
                    day[timeSlot][accommodationActivityIndex].link = `https://maps.google.com/?q=${encodeURIComponent(`${hotelName}, ${destination}`)}`;
                    activityReplaced = true;
                    break;
                }
            }
        }
        if(activityReplaced) break;
    }

    if (!activityReplaced && newItinerary.dailyPlan[0]) {
        // If no check-in activity was found, prepend it to the first day's morning activities
        const dayOneMorning = newItinerary.dailyPlan[0].morning || [];
        dayOneMorning.unshift({
            startTime: "2:00 PM",
            endTime: "3:00 PM",
            description: `Check into **${hotelName}**`,
            location: `${hotelName}, ${destination}`,
            link: `https://maps.google.com/?q=${encodeURIComponent(`${hotelName}, ${destination}`)}`,
            travelInfo: "Welcome to your hotel!"
        });
        newItinerary.dailyPlan[0].morning = dayOneMorning;
    }
  
    setItinerary(newItinerary);
    toast({
      title: "Itinerary Updated",
      description: `${hotelName} has been added to your plan.`,
    });
  };

  const handleSaveTrip = () => {
    if (!isAuthenticated) {
        openAuthModal('login');
        toast({
            title: "Login Required",
            description: "Please log in to save your trip.",
            variant: "destructive"
        });
        return;
    }
    if (itinerary && destination && origin) {
        addTrip({
            id: `trip_${Date.now()}`,
            name: `Trip to ${destination}`,
            itinerary,
            destination,
            origin,
            createdAt: new Date().toISOString(),
        });
    }
  };

  const isCurrentTripSaved = () => {
    if (!itinerary || trips.length === 0) return false;
    // A simple check: if a trip with the same destination and very similar plan exists.
    return trips.some(trip => 
        trip.destination === destination &&
        trip.itinerary.dailyPlan[0]?.title === itinerary.dailyPlan[0]?.title
    );
  };
  
  return (
    <div className="flex flex-col">
        <HeroSection tripType={tripType} setTripType={setTripType} form={form}>
            <ItineraryForm
              form={form}
              onSubmit={onSubmit}
              isLoading={isLoading}
              tripType={tripType}
              setTripType={setTripType}
            />
        </HeroSection>
        <main ref={resultsRef} className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-background p-4 md:p-8 rounded-lg -mt-20 relative z-10 shadow-lg space-y-8 min-h-[40vh]">
                {isLoading ? (
                    <div className="w-full h-96 flex items-center justify-center">
                        <div className="flex flex-col items-center gap-4">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                            <p className="text-muted-foreground text-lg">Generating your adventure...</p>
                        </div>
                    </div>
                ) : itinerary && destination && origin ? (
                    <div className="space-y-8 h-full flex flex-col">
                      {viewState === 'PLAN' ? (
                        <>
                          <div className="text-right">
                             <Button onClick={() => setViewState('BOOK')} className="bg-accent hover:bg-accent/90 text-accent-foreground">
                                <Ticket className="mr-2 h-4 w-4" /> Book Travel & Hotels
                            </Button>
                          </div>
                          <ItineraryDisplay 
                            itineraryData={itinerary} 
                            destination={destination} 
                            origin={origin}
                            onItineraryUpdate={setItinerary}
                            onSaveTrip={handleSaveTrip}
                            isSaved={isCurrentTripSaved()}
                          />
                        </>
                      ) : (
                        <TravelOptions 
                            outboundTravelOptions={outboundTravelOptions!} 
                            returnTravelOptions={returnTravelOptions}
                            hotelOptions={outboundTravelOptions!.hotelOptions}
                            onHotelBooked={handleHotelBooking}
                            onBackToPlan={() => setViewState('PLAN')}
                        />
                      )}
                    </div>
                ) : (
                    <div className="w-full h-full bg-card rounded-lg flex items-center justify-center p-8 min-h-[40vh]">
                        <div className="text-center">
                            <h2 className="text-2xl font-semibold text-primary">Let's Plan Your Next Trip</h2>
                            <p className="text-muted-foreground mt-2">Fill out the form above to generate your personalized travel itinerary and booking options.</p>
                        </div>
                    </div>
                )}
                {error && <p className="text-destructive text-sm mt-4 text-center">{error}</p>}
            </div>
        </main>
        <AuthModal />
    </div>
  );
}
