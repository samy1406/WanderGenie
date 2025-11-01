
// src/components/trip-planner.tsx
"use client";

import { useState, useEffect, useRef, Suspense } from "react";
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
import { useBooking } from "@/context/booking-context";
import { useSearchParams } from "next/navigation";


export type TripType = "oneway" | "roundtrip";
type ViewState = 'PLAN' | 'BOOK';

function TripPlannerContent() {
  const { toast } = useToast();
  const { isAuthenticated, user, openAuthModal } = useAuth();
  const { currentTrip, setCurrentTrip, addTrip, isCurrentTripSaved, clearCurrentTrip } = useTrip();
  const { addBookingAndSaveTrip } = useBooking();
  const searchParams = useSearchParams();

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

  // Effect to handle navigating directly to the booking view
  useEffect(() => {
    if (searchParams.get('view') === 'book' && currentTrip) {
      setViewState('BOOK');
    }
  }, [searchParams, currentTrip]);

  useEffect(() => {
    if (currentTrip) {
        // When a trip is loaded or set, update the form
        form.reset({
            origin: currentTrip.origin,
            destination: currentTrip.destination,
            tripDuration: currentTrip.itinerary.dailyPlan.length,
            interests: currentTrip.interests,
            travelPreference: currentTrip.travelPreference,
            departureDate: currentTrip.departureDate ? new Date(currentTrip.departureDate) : new Date(),
            returnDate: currentTrip.returnDate ? new Date(currentTrip.returnDate) : undefined,
            tripType: currentTrip.returnDate ? 'roundtrip' : 'oneway',
        });
        setTripType(currentTrip.returnDate ? 'roundtrip' : 'oneway');
        // Do not automatically change viewState here, let the ?view=book param handle it
    } else {
        // Optional: Reset form to defaults if there's no current trip
        // form.reset();
    }
  }, [currentTrip, form]);


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
    clearCurrentTrip(); // Clear any existing trip before generating a new one
    setViewState('PLAN'); // Default to plan view first
    
    try {
      const itineraryPromise = handleGenerateItinerary({
        destination: values.destination,
        tripDuration: values.tripDuration,
        interests: values.interests,
        travelPreference: values.travelPreference,
        arrivalTime: values.arrivalTime,
        departureTime: values.departureTime,
      });

      const outboundOptionsPromise = handleGetTravelOptions({
          origin: values.origin,
          destination: values.destination,
          travelPreference: values.travelPreference,
          departureTime: values.departureTime,
          arrivalTime: values.arrivalTime
      });
      
      const promises: Promise<any>[] = [itineraryPromise, outboundOptionsPromise];

      if (values.tripType === 'roundtrip' && values.returnDate) {
          const returnOptionsPromise = handleGetTravelOptions({
              origin: values.destination, // Swap origin and destination
              destination: values.origin,
              travelPreference: values.travelPreference,
              departureTime: values.departureTime, // This could be made specific for return
              arrivalTime: values.arrivalTime // This could be made specific for return
          });
          promises.push(returnOptionsPromise);
      } else {
          promises.push(Promise.resolve(null)); // Ensure there's always a third element
      }

      const [itineraryResult, outboundOptionsResult, returnOptionsResult] = await Promise.all(promises);

      if (!itineraryResult) throw new Error("The generated itinerary was empty.");
      if (!outboundOptionsResult) throw new Error("Could not get outbound travel options.");

      setCurrentTrip({
        id: `trip_${Date.now()}`,
        name: `Trip to ${values.destination}`,
        origin: values.origin,
        destination: values.destination,
        interests: values.interests,
        travelPreference: values.travelPreference,
        departureDate: values.departureDate.toISOString(),
        returnDate: values.returnDate ? values.returnDate.toISOString() : undefined,
        itinerary: itineraryResult,
        outboundTravelOptions: outboundOptionsResult,
        returnTravelOptions: returnOptionsResult,
        bookingIds: [],
        createdAt: new Date().toISOString(),
        userId: user?.id,
      });

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

  const handleItineraryUpdate = (newItinerary: GeneratePersonalizedItineraryOutput) => {
      if (currentTrip) {
          setCurrentTrip({ ...currentTrip, itinerary: newItinerary });
      }
  }

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
    if (currentTrip) {
        addTrip(currentTrip);
    }
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
                ) : currentTrip ? (
                    <div className="space-y-8 h-full flex flex-col">
                      {viewState === 'PLAN' ? (
                        <>
                          <ItineraryDisplay 
                            itineraryData={currentTrip.itinerary} 
                            destination={currentTrip.destination} 
                            origin={currentTrip.origin}
                            onItineraryUpdate={handleItineraryUpdate}
                            onSaveTrip={handleSaveTrip}
                            isSaved={isCurrentTripSaved()}
                            departureDate={new Date(currentTrip.departureDate)}
                          />
                          <div className="text-center">
                             <Button onClick={() => setViewState('BOOK')} className="bg-accent hover:bg-accent/90 text-accent-foreground">
                                <Ticket className="mr-2 h-4 w-4" /> View Travel & Hotel Options
                            </Button>
                          </div>
                        </>
                      ) : (
                        <TravelOptions 
                            onHotelBooked={(hotelName) => {
                                // This callback is now mainly for UI feedback if needed
                                // The itinerary update is handled within the context
                                toast({
                                    title: "Itinerary Updated",
                                    description: `${hotelName} has been added to your plan.`,
                                });
                            }}
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

export function TripPlanner() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <TripPlannerContent />
        </Suspense>
    )
}
