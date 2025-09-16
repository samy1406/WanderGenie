"use client";

import { useState } from "react";
import ItineraryForm from "@/components/itinerary-form";
import ItineraryDisplay from "@/components/itinerary-display";
import TravelOptions from "@/components/travel-options";
import type { GeneratePersonalizedItineraryOutput } from "@/ai/flows/generate-personalized-itinerary";
import type { GetTravelOptionsOutput } from "@/ai/flows/get-travel-options";
import Image from "next/image";
import { placeholderImages } from "@/lib/placeholder-images.json";
import { Compass } from "lucide-react";

export function TripPlanner() {
  const [itinerary, setItinerary] = useState<GeneratePersonalizedItineraryOutput | null>(null);
  const [travelOptions, setTravelOptions] = useState<GetTravelOptionsOutput | null>(null);
  const [destination, setDestination] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const heroImage = placeholderImages.find(img => img.id === 'hero');

  return (
    <div className="grid md:grid-cols-2 min-h-screen">
      <div className="flex flex-col bg-card p-8 md:p-12">
        <div className="flex items-center mb-8">
            <Compass className="h-8 w-8 text-primary" />
            <span className="ml-3 text-3xl font-headline font-semibold">WanderGenie</span>
        </div>
        <div className="space-y-4 mb-8">
            <h1 className="text-4xl md:text-5xl font-bold font-headline tracking-tighter">
                Your Personal AI Trip Planner
            </h1>
            <p className="text-lg text-muted-foreground">
                Craft a unique, day-by-day itinerary just for you.
            </p>
        </div>
        <ItineraryForm
          setItinerary={setItinerary}
          setTravelOptions={setTravelOptions}
          setDestination={setDestination}
          setIsLoading={setIsLoading}
          setError={setError}
          isLoading={isLoading}
        />
        {error && <p className="text-destructive text-sm mt-4">{error}</p>}
      </div>
      <div className="bg-background p-4 md:p-8">
        <div className="h-full w-full rounded-lg">
          {isLoading ? (
            <div className="w-full h-full flex items-center justify-center">
              <div className="flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                <p className="text-muted-foreground">Generating your adventure...</p>
              </div>
            </div>
          ) : itinerary && destination && travelOptions ? (
            <div className="space-y-8 h-full">
              <ItineraryDisplay itineraryData={itinerary} destination={destination} />
              <TravelOptions travelOptionsData={travelOptions} />
            </div>
          ) : (
            <div className="w-full h-full bg-card rounded-lg overflow-hidden shadow-lg flex items-center justify-center">
               {heroImage && (
                <div className="relative w-full h-full">
                    <Image
                    src={heroImage.imageUrl}
                    alt={heroImage.description}
                    fill
                    className="object-cover"
                    data-ai-hint={heroImage.imageHint}
                    />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                        <p className="text-white text-2xl font-headline text-center max-w-sm">Fill out the form to see your personalized travel plan.</p>
                    </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
