// src/components/hero-section.tsx
import React from 'react';
import { Button } from './ui/button';
import type { TripType } from './trip-planner';
import { VoiceForm } from './voice-form';
import type { useForm } from 'react-hook-form';
import type { z } from 'zod';
import type { formSchema } from './itinerary-form';

type HeroSectionProps = {
  children: React.ReactNode;
  tripType: TripType;
  setTripType: (tripType: TripType) => void;
  form: ReturnType<typeof useForm<z.infer<typeof formSchema>>>;
};

export const HeroSection = ({ children, tripType, setTripType, form }: HeroSectionProps) => {
  const onTranscriptionComplete = (transcribedText: string) => {
    // You could call an AI flow here to parse the text and set form values
    console.log("Transcribed text:", transcribedText);
    // For now, let's just log it. A real implementation would use handleExtractTripDetails
  };

  return (
    <div className="relative bg-gradient-to-r from-blue-500 to-cyan-400 text-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
        <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
                <Button 
                    variant={tripType === 'oneway' ? 'secondary' : 'ghost'} 
                    onClick={() => setTripType('oneway')}
                    className="bg-white/90 text-blue-600 rounded-full shadow-lg data-[variant=ghost]:bg-transparent data-[variant=ghost]:text-white hover:bg-white hover:text-blue-600">
                    One Way
                </Button>
                <Button 
                    variant={tripType === 'roundtrip' ? 'secondary' : 'ghost'}
                    onClick={() => setTripType('roundtrip')}
                    className="bg-white/90 text-blue-600 rounded-full shadow-lg data-[variant=ghost]:bg-transparent data-[variant=ghost]:text-white hover:bg-white hover:text-blue-600">
                    Round Trip
                </Button>
            </div>
            <div className='flex items-center gap-4'>
                 <VoiceForm onTranscriptionComplete={onTranscriptionComplete} form={form} />
                <p className="text-lg font-semibold hidden md:block">Search Lowest Price</p>
            </div>
        </div>
        {children}
      </div>
    </div>
  );
};
