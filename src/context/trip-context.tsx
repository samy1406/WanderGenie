
// src/context/trip-context.tsx
'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { GeneratePersonalizedItineraryOutput } from '@/ai/flows/generate-personalized-itinerary';
import { useAuth } from './auth-context';
import { useToast } from '@/hooks/use-toast';

export type Trip = {
    id: string;
    name: string;
    itinerary: GeneratePersonalizedItineraryOutput;
    destination: string;
    origin: string;
    createdAt: string;
    userId?: string;
};

type TripContextType = {
  trips: Trip[];
  addTrip: (trip: Omit<Trip, 'userId'>) => void;
  getTrip: (tripId: string) => Trip | undefined;
  deleteTrip: (tripId: string) => void;
  selectedTrip: Trip | null;
  setSelectedTrip: (trip: Trip | null) => void;
};

const TripContext = createContext<TripContextType | undefined>(undefined);

export function TripProvider({ children }: { children: ReactNode }) {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();

  const getStorageKey = (userId?: string | null) => `wandergenie-trips-${userId || 'guest'}`;

  useEffect(() => {
    if (isAuthenticated && user) {
        try {
            const storedTrips = localStorage.getItem(getStorageKey(user.id));
            if (storedTrips) {
                setTrips(JSON.parse(storedTrips));
            } else {
                setTrips([]);
            }
        } catch (error) {
            console.error("Could not load trips from localStorage", error);
            setTrips([]);
        }
    } else {
        setTrips([]); // Clear trips if user logs out
    }
  }, [isAuthenticated, user]);
  
  const saveTripsToStorage = (tripsToSave: Trip[], userId: string) => {
    try {
      localStorage.setItem(getStorageKey(userId), JSON.stringify(tripsToSave));
    } catch (error) {
      console.error("Could not save trips to localStorage", error);
    }
  };

  const addTrip = (trip: Omit<Trip, 'userId'>) => {
    if (!user) {
        toast({ title: "Error", description: "You must be logged in to save a trip.", variant: "destructive"});
        return;
    };
    const newTrip = { ...trip, userId: user.id };
    const newTrips = [...trips, newTrip];
    setTrips(newTrips);
    saveTripsToStorage(newTrips, user.id);
    toast({ title: "Trip Saved!", description: `${trip.name} has been added to your collection.` });
  };

  const getTrip = (tripId: string) => {
    return trips.find(t => t.id === tripId);
  }

  const deleteTrip = (tripId: string) => {
    if (!user) return;
    const newTrips = trips.filter(t => t.id !== tripId);
    setTrips(newTrips);
    saveTripsToStorage(newTrips, user.id);
    toast({ title: "Trip Deleted", description: "The trip has been removed from your list." });
  }

  const value = {
    trips,
    addTrip,
    getTrip,
    deleteTrip,
    selectedTrip,
    setSelectedTrip
  };

  return <TripContext.Provider value={value}>{children}</TripContext.Provider>;
}

export function useTrip() {
  const context = useContext(TripContext);
  if (context === undefined) {
    throw new Error('useTrip must be used within a TripProvider');
  }
  return context;
}
