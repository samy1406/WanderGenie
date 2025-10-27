// src/components/hero-section.tsx
import React from 'react';
import { Button } from './ui/button';

export const HeroSection = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="relative bg-gradient-to-r from-blue-500 to-cyan-400 text-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-32">
        <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
                <Button variant="secondary" className="bg-white/90 text-blue-600 rounded-full shadow-lg hover:bg-white">One Way</Button>
                <Button variant="ghost" className="rounded-full">Round Trip</Button>
                <Button variant="ghost" className="rounded-full">Multicity</Button>
            </div>
            <p className="text-lg font-semibold">Search Lowest Price</p>
        </div>
        {children}
      </div>
    </div>
  );
};
