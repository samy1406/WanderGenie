
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
    interests: string;
    travelPreference: "budget" | "comfort" | "speed";
    departureDate: string;
    returnDate?: string;
    itinerary: GeneratePersonalizedItineraryOutput;
    outboundTravelOptions?: GetTravelOptionsOutput;
    returnTravelOptions?: GetTravelOptionsOutput | null;
    userId?: string;
    bookingIds: string[]; // Changed to non-optional
    createdAt: string;
};

type TripContextType = {
  trips: Trip[];
  addTrip: (trip: Trip) => void;
  updateTrip: (trip: Trip) => void;
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

  const getStorageKey = useCallback((userId?: string) => `wandergenie-trips-${userId || 'guest'}`, []);

  const loadTripsForUser = useCallback((userId?: string) => {
    const key = getStorageKey(userId);
    if (!userId) {
        setTrips([]);
        return;
    }
    try {
        const storedTrips = localStorage.getItem(key);
        setTrips(storedTrips ? JSON.parse(storedTrips) : []);
    } catch (error) {
        console.error("Could not load trips from localStorage", error);
        setTrips([]);
    }
  }, [getStorageKey]);

  useEffect(() => {
    const userId = user?.id;
    loadTripsForUser(userId);
    
    const handleStorageChange = (event: StorageEvent) => {
        if (userId && event.key === getStorageKey(userId)) {
            loadTripsForUser(userId);
        }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
        window.removeEventListener('storage', handleStorageChange);
    };

  }, [user, getStorageKey, loadTripsForUser]);
  
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

    setTrips(prevTrips => {
        const tripExists = prevTrips.some(t => t.id === tripWithUser.id);
        let newTrips;
        if (tripExists) {
            newTrips = prevTrips.map(t => t.id === tripWithUser.id ? tripWithUser : t);
        } else {
            newTrips = [...prevTrips, tripWithUser];
        }
        saveTripsToStorage(newTrips, user.id);
        return newTrips;
    });
    
    toast({ title: "Trip Saved!", description: `${trip.name} has been added to your collection.` });
  }, [user, saveTripsToStorage, toast]);

  const updateTrip = useCallback((trip: Trip) => {
    if (!user) return;
    setTrips(prevTrips => {
        const newTrips = prevTrips.map(t => t.id === trip.id ? trip : t);
        saveTripsToStorage(newTrips, user.id);
        return newTrips;
    });
  }, [user, saveTripsToStorage]);

  const getTrip = (tripId: string) => {
    return trips.find(t => t.id === tripId);
  }

  const deleteTrip = (tripId: string) => {
    if (!user) return;
    setTrips(prevTrips => {
        const newTrips = prevTrips.filter(t => t.id !== tripId);
        saveTripsToStorage(newTrips, user.id);
        return newTrips;
    });
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
    updateTrip,
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
