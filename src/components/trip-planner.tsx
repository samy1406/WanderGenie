
// src/components/trip-planner.tsx
"use client";

import { useState, useEffect } from "react";
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

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      origin: "",
      destination: "",
      tripDuration: 3,
      interests: "",
      travelPreference: "budget",
      departureTime: "any",
      arrivalTime: "any",
      tripType: "oneway",
    },
  });

  // Update tripType in form when it changes using useEffect
  useEffect(() => {
    form.setValue("tripType", tripType);
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
    if (!itinerary) return;

    // Create a deep copy to avoid direct state mutation
    const newItinerary = JSON.parse(JSON.stringify(itinerary));

    const dayOneActivities = newItinerary.dailyPlan[0]?.activities;
    if (dayOneActivities && dayOneActivities.length > 0) {
      // Find the first activity that mentions "accommodation"
      const accommodationActivityIndex = dayOneActivities.findIndex((activity: any) => 
        activity.description.toLowerCase().includes('accommodation')
      );

      if (accommodationActivityIndex !== -1) {
        // Replace it with the booked hotel
        dayOneActivities[accommodationActivityIndex] = {
          ...dayOneActivities[accommodationActivityIndex],
          description: `Check into ${hotelName}`,
          location: hotelName,
        };
      } else {
        // If not found, prepend it
        dayOneActivities.unshift({
          description: `Check into ${hotelName}`,
          location: hotelName,
          link: `https://maps.google.com/?q=${encodeURIComponent(hotelName)}`
        });
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
            />
        </HeroSection>
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-background p-4 md:p-8 flex flex-col rounded-lg -mt-32 relative z-10 shadow-lg">
                {isLoading ? (
                    <div className="w-full h-96 flex items-center justify-center">
                        <div className="flex flex-col items-center gap-4">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                            <p className="text-muted-foreground text-lg">Generating your adventure...</p>
                        </div>
                    </div>
                ) : itinerary && destination && outboundTravelOptions && origin ? (
                    <div className="space-y-8 h-full flex flex-col">
                        <ItineraryDisplay itineraryData={itinerary} destination={destination} origin={origin} />
                        <TravelOptions 
                            outboundTravelOptions={outboundTravelOptions} 
                            returnTravelOptions={returnTravelOptions}
                            hotelOptions={outboundTravelOptions.hotelOptions}
                            onHotelBooked={handleHotelBooking}
                        />
                    </div>
                ) : (
                    <div className="w-full h-full bg-card rounded-lg flex items-center justify-center p-8">
                        <div className="text-center">
                            <h2 className="text-2xl font-semibold text-primary">Let's Plan Your Next Trip</h2>
                            <p className="text-muted-foreground mt-2">Fill out the form above to generate your personalized travel itinerary and booking options.</p>
                        </div>
                    </div>
                )}
                {error && <p className="text-destructive text-sm mt-4 text-center">{error}</p>}
            </div>
        </main>
    </div>
  );
}
