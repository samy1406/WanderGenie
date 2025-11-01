
// src/context/booking-context.tsx
'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import type { GetTravelOptionsOutput } from '@/ai/flows/get-travel-options';
import type { GeneratePersonalizedItineraryOutput } from '@/ai/flows/generate-personalized-itinerary';
import { useTrip, type Trip } from './trip-context';
import { useAuth } from './auth-context';

type TravelOption = GetTravelOptionsOutput['travelOptions'][0];
type HotelOption = GetTravelOptionsOutput['hotelOptions'][0];

type BookingItem = {
    item: TravelOption | HotelOption;
    type: 'travel' | 'hotel';
}

export type Passenger = {
    title: string;
    firstName: string;
    lastName: string;
    gender: 'male' | 'female' | 'other' | string;
    age: number;
};

type PassengerDetails = {
    passengers: Passenger[];
    email: string;
    phone: string;
};

export type SeatDetails = {
    pnr: string;
    seats: string[];
}

export type InsuranceDetails = {
    policyId: string;
    provider: string;
    coverageAmount: number;
}

export type PriceSummary = {
    baseFare: number;
    gst: number;
    platformFee: number;
    insurance: number;
    subTotal: number;
    discount: number;
    grandTotal: number;
}

export type Booking = BookingItem & {
    id: string;
    tripId?: string; // Associate booking with a trip
    passengerDetails: PassengerDetails;
    bookingDate: string;
    transactionId?: string;
    amountPaid?: number;
    itinerary?: GeneratePersonalizedItineraryOutput;
    seatDetails?: SeatDetails;
    insuranceDetails?: InsuranceDetails;
    priceSummary?: PriceSummary;
};


type BookingContextType = {
  bookingOption: BookingItem | null;
  setBookingOption: (option: BookingItem | null) => void;
  bookings: Booking[];
  addBookingAndSaveTrip: (booking: Omit<Booking, 'tripId'>, tripToSave: Trip) => void;
  deleteBooking: (bookingId: string) => void;
  deleteBookingFromList: (bookingId: string) => void;
  updateBookingInList: (updatedBooking: Booking) => void;
  getBookingById: (bookingId: string) => Booking | undefined;
  getBookingsForTrip: (tripId: string) => Booking[];
  pendingBooking: Booking | null;
  setPendingBooking: (booking: Booking | null) => void;
  clearPendingBooking: () => void;
};

const BookingContext = createContext<BookingContextType | undefined>(undefined);
const BOOKINGS_STORAGE_KEY = 'wandergenie-bookings';

export function BookingProvider({ children }: { children: ReactNode }) {
  const [bookingOption, setBookingOption] = useState<BookingItem | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [pendingBooking, setPendingBooking] = useState<Booking | null>(null);
  const { addTrip, setCurrentTrip, updateTrip } = useTrip();
  const { isAuthenticated, handlePostAuth } = useAuth();
  
  const loadBookingsFromStorage = useCallback(() => {
    try {
        const storedBookings = localStorage.getItem(BOOKINGS_STORAGE_KEY);
        setBookings(storedBookings ? JSON.parse(storedBookings) : []);
    } catch (error) {
        console.error("Could not load bookings from localStorage", error);
        setBookings([]);
    }
  }, []);

  useEffect(() => {
    loadBookingsFromStorage();

    const handleStorageChange = (event: StorageEvent) => {
        if (event.key === BOOKINGS_STORAGE_KEY) {
            loadBookingsFromStorage();
        }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
        window.removeEventListener('storage', handleStorageChange);
    };
  }, [loadBookingsFromStorage]);
  
  // Effect to complete pending booking after authentication
  useEffect(() => {
    if (isAuthenticated && pendingBooking) {
      handlePostAuth();
    }
  }, [isAuthenticated, pendingBooking, handlePostAuth]);


  const addBookingAndSaveTrip = (booking: Omit<Booking, 'tripId'>, tripToSave: Trip) => {
    const bookingWithTripId: Booking = { ...booking, tripId: tripToSave.id };
    
    // Use a function with the state setter to get the most recent state
    setBookings(prevBookings => {
        const newBookings = [...prevBookings, bookingWithTripId];
        localStorage.setItem(BOOKINGS_STORAGE_KEY, JSON.stringify(newBookings));
        return newBookings;
    });
    
    let updatedTrip = { ...tripToSave, bookingIds: [...(tripToSave.bookingIds || []), booking.id] };

    if (booking.type === 'hotel') {
        const hotelName = (booking.item as HotelOption).name.replace(/\*\*/g, ''); // Get name without asterisks
        let newItinerary = JSON.parse(JSON.stringify(tripToSave.itinerary));
        
        let activityReplaced = false;
        // Search for the placeholder activity and replace it with the booked hotel.
        for (const day of newItinerary.dailyPlan) {
            for (const timeSlot of ['morning', 'afternoon', 'evening', 'night']) {
                if ((day as any)[timeSlot]) {
                    const accommodationActivityIndex = (day as any)[timeSlot].findIndex((activity: any) =>
                        activity.description.toLowerCase().includes('accommodation') ||
                        activity.description.toLowerCase().includes('hotel')
                    );
                    
                    if (accommodationActivityIndex !== -1) {
                        // Update the existing placeholder activity
                        (day as any)[timeSlot][accommodationActivityIndex].description = `Check into **${hotelName}**`;
                        (day as any)[timeSlot][accommodationActivityIndex].location = `${hotelName}, ${tripToSave.destination}`;
                         (day as any)[timeSlot][accommodationActivityIndex].link = `https://maps.google.com/?q=${encodeURIComponent(`${hotelName}, ${tripToSave.destination}`)}`;
                        activityReplaced = true;
                        break;
                    }
                }
            }
            if(activityReplaced) break;
        }

        // If no placeholder was found, inject a new activity for check-in on Day 1.
        if (!activityReplaced && newItinerary.dailyPlan[0]) {
            const dayOneMorning = newItinerary.dailyPlan[0].morning || [];
            dayOneMorning.unshift({
                startTime: "2:00 PM",
                endTime: "3:00 PM",
                description: `Check into **${hotelName}**`,
                location: `${hotelName}, ${tripToSave.destination}`,
                link: `https://maps.google.com/?q=${encodeURIComponent(`${hotelName}, ${tripToSave.destination}`)}`,
                travelInfo: "Welcome to your hotel!"
            });
            newItinerary.dailyPlan[0].morning = dayOneMorning;
        }
        updatedTrip.itinerary = newItinerary;
    }

    updateTrip(updatedTrip); // Use updateTrip to save changes to localStorage
    setCurrentTrip(updatedTrip); // Make it the active trip in the UI
  };
  
  const deleteBooking = (bookingId: string) => {
    setBookings(prevBookings => {
        const newBookings = prevBookings.filter(b => b.id !== bookingId);
        localStorage.setItem(BOOKINGS_STORAGE_KEY, JSON.stringify(newBookings));
        return newBookings;
    });
  };
  
  const deleteBookingFromList = (bookingId: string) => {
    deleteBooking(bookingId);
  };

  const updateBookingInList = (updatedBooking: Booking) => {
    setBookings(prevBookings => {
        const bookingIndex = prevBookings.findIndex(b => b.id === updatedBooking.id);
        if(bookingIndex !== -1) {
            const newBookings = [...prevBookings];
            newBookings[bookingIndex] = updatedBooking;
            localStorage.setItem(BOOKINGS_STORAGE_KEY, JSON.stringify(newBookings));
            return newBookings;
        }
        return prevBookings;
    });
  };

  const getBookingById = (bookingId: string) => {
    return bookings.find(b => b.id === bookingId);
  }

  const getBookingsForTrip = (tripId: string) => {
    return bookings.filter(b => b.tripId === tripId);
  }

  const clearPendingBooking = () => {
    setPendingBooking(null);
  };

  const value = {
    bookingOption,
    setBookingOption,
    bookings,
    addBookingAndSaveTrip,
    deleteBooking,
    deleteBookingFromList,
    updateBookingInList,
    getBookingById,
    getBookingsForTrip,
    pendingBooking,
    setPendingBooking,
    clearPendingBooking
  };

  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>;
}

export function useBooking() {
  const context = useContext(BookingContext);
  if (context === undefined) {
    throw new Error('useBooking must be used within a BookingProvider');
  }
  return context;
}
