
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
import { differenceInDays, addDays, isSameDay } from 'date-fns';
import { useAuth } from "@/context/auth-context";

export type TripType = "oneway" | "roundtrip";

export function TripPlanner() {
  const [itinerary, setItinerary] = useState<GeneratePersonalizedItineraryOutput | null>(null);
  const [outboundTravelOptions, setOutboundTravelOptions] = useState<GetTravelOptionsOutput | null>(null);
  const [returnTravelOptions, setReturnTravelOptions] = useState<GetTravelOptionsOutput | null>(null);
  const [destination, setDestination] = useState<string | null>(null);
  const [origin, setOrigin] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tripType, setTripType] = useState<TripType>("oneway");
  const { toast } = useToast();
  const { user } = useAuth();

  const isInitialRender = useRef(true);

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
    
    setDestination(values.destination);
    setOrigin(values.origin);
    
    try {
      const itineraryPromise = handleGenerateItinerary({
        destination: values.destination,
        tripDuration: values.tripDuration,
        interests: values.interests,
        travelPreference: values.travelPreference,
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
    }
  }

  const handleHotelBooking = (hotelName: string) => {
    if (!itinerary || !destination) return;
  
    // Create a deep copy to avoid direct state mutation
    const newItinerary = JSON.parse(JSON.stringify(itinerary));
  
    const dayOneActivities = newItinerary.dailyPlan[0]?.activities;
    if (dayOneActivities && dayOneActivities.length > 0) {
      // Find the first activity that mentions "accommodation"
      const accommodationActivityIndex = dayOneActivities.findIndex((activity: any) =>
        activity.description.toLowerCase().includes('accommodation')
      );
  
      const newActivity = {
        description: `Check into **${hotelName}**`,
        location: `${hotelName}, ${destination}`, // Provide city context for better geocoding
        link: `https://maps.google.com/?q=${encodeURIComponent(`${hotelName}, ${destination}`)}`
      };
  
      if (accommodationActivityIndex !== -1) {
        // Replace the existing accommodation activity
        dayOneActivities[accommodationActivityIndex] = newActivity;
      } else {
        // If not found for some reason, prepend it to the day's activities
        dayOneActivities.unshift(newActivity);
      }
    }
  
    setItinerary(newItinerary);
    toast({
      title: "Itinerary Updated",
      description: `${hotelName} has been added to your plan.`,
    });
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
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-background p-4 md:p-8 rounded-lg -mt-20 relative z-10 shadow-lg space-y-8">
                {isLoading ? (
                    <div className="w-full h-96 flex items-center justify-center">
                        <div className="flex flex-col items-center gap-4">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                            <p className="text-muted-foreground text-lg">Generating your adventure...</p>
                        </div>
                    </div>
                ) : itinerary && destination && outboundTravelOptions && origin ? (
                    <div className="space-y-8 h-full flex flex-col">
                        <ItineraryDisplay 
                          itineraryData={itinerary} 
                          destination={destination} 
                          origin={origin}
                          onItineraryUpdate={setItinerary}
                          user={user}
                        />
                        <TravelOptions 
                            outboundTravelOptions={outboundTravelOptions} 
                            returnTravelOptions={returnTravelOptions}
                            hotelOptions={outboundTravelOptions.hotelOptions}
                            onHotelBooked={handleHotelBooking}
                        />
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
