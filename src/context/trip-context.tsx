
// src/context/trip-context.tsx
'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import type { GeneratePersonalizedItineraryOutput } from '@/ai/flows/generate-personalized-itinerary';
import type { GetTravelOptionsOutput } from '@/ai/flows/get-travel-options';
import { useAuth } from './auth-context';
import { useToast } from '@/hooks/use-toast';

export type Trip = {
    id: string;
    name: string;
    origin: string;
    destination: string;
    departureDate: string;
    returnDate?: string;
    itinerary: GeneratePersonalizedItineraryOutput;
    outboundTravelOptions?: GetTravelOptionsOutput;
    returnTravelOptions?: GetTravelOptionsOutput | null;
    userId?: string;
};

type TripContextType = {
  trips: Trip[];
  addTrip: (trip: Trip) => void;
  getTrip: (tripId: string) => Trip | undefined;
  deleteTrip: (tripId: string) => void;
  currentTrip: Trip | null;
  setCurrentTrip: (trip: Trip | null) => void;
  isCurrentTripSaved: () => boolean;
  clearCurrentTrip: (forceClear?: boolean) => void;
};

const TripContext = createContext<TripContextType | undefined>(undefined);

export function TripProvider({ children }: { children: ReactNode }) {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [currentTrip, setCurrentTripState] = useState<Trip | null>(null);
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();

  const getStorageKey = useCallback((userId?: string | null) => `wandergenie-trips-${userId || 'guest'}`, []);

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
        setCurrentTripState(null); // Also clear the active trip
    }
  }, [isAuthenticated, user, getStorageKey]);
  
  const saveTripsToStorage = useCallback((tripsToSave: Trip[], userId: string) => {
    try {
      localStorage.setItem(getStorageKey(userId), JSON.stringify(tripsToSave));
    } catch (error) {
      console.error("Could not save trips to localStorage", error);
    }
  }, [getStorageKey]);

  const addTrip = useCallback((trip: Trip) => {
    if (!user) {
        toast({ title: "Error", description: "You must be logged in to save a trip.", variant: "destructive"});
        return;
    };
    
    const tripWithUser = { ...trip, userId: user.id };

    // Check if the trip already exists by a unique property (e.g., id)
    const tripExists = trips.some(t => t.id === tripWithUser.id);
    let newTrips;
    if (tripExists) {
        // Update the existing trip
        newTrips = trips.map(t => t.id === tripWithUser.id ? tripWithUser : t);
    } else {
        // Add the new trip
        newTrips = [...trips, tripWithUser];
    }
    
    setTrips(newTrips);
    saveTripsToStorage(newTrips, user.id);
    toast({ title: "Trip Saved!", description: `${trip.name} has been added to your collection.` });
  }, [user, trips, saveTripsToStorage, toast]);

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
  
  const setCurrentTrip = (trip: Trip | null) => {
      setCurrentTripState(trip);
  }

  const isCurrentTripSaved = useCallback(() => {
    if (!currentTrip || trips.length === 0) return false;
    return trips.some(trip => trip.id === currentTrip.id);
  }, [currentTrip, trips]);

  const clearCurrentTrip = (forceClear = true) => {
    if(forceClear) {
        setCurrentTrip(null);
    }
  };

  const value = {
    trips,
    addTrip,
    getTrip,
    deleteTrip,
    currentTrip,
    setCurrentTrip,
    isCurrentTripSaved,
    clearCurrentTrip,
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
