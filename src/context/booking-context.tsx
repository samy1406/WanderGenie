
// src/context/booking-context.tsx
'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
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

export type Booking = BookingItem & {
    id: string;
    passengerDetails: PassengerDetails;
    bookingDate: string;
    transactionId?: string;
    amountPaid?: number;
    itinerary?: GeneratePersonalizedItineraryOutput;
    seatDetails?: SeatDetails;
    insuranceDetails?: InsuranceDetails;
};


type BookingContextType = {
  bookingOption: BookingItem | null;
  setBookingOption: (option: BookingItem | null) => void;
  bookings: Booking[];
  addBookingAndSaveTrip: (booking: Booking, tripToSave: Trip) => void;
  deleteBooking: (bookingId: string) => void;
  updateBookingInList: (updatedBooking: Booking) => void;
  getBookingById: (bookingId: string) => Booking | undefined;
  pendingBooking: Booking | null;
  setPendingBooking: (booking: Booking | null) => void;
  clearPendingBooking: () => void;
};

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export function BookingProvider({ children }: { children: ReactNode }) {
  const [bookingOption, setBookingOption] = useState<BookingItem | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [pendingBooking, setPendingBooking] = useState<Booking | null>(null);
  const { addTrip, setCurrentTrip } = useTrip();
  const { isAuthenticated, handlePostAuth } = useAuth();
  
  useEffect(() => {
    try {
        const storedBookings = localStorage.getItem('wandergenie-bookings');
        if (storedBookings) {
          setBookings(JSON.parse(storedBookings));
        }
    } catch (error) {
        console.error("Could not load bookings from localStorage", error);
    }
  }, []);
  
  // Effect to complete pending booking after authentication
  useEffect(() => {
    if (isAuthenticated && pendingBooking) {
      // In a real app you might automatically trigger the booking submission here
      // For this app, we let the user re-click the 'Pay' button.
      // We can notify the AuthContext to close the modal.
      handlePostAuth();
    }
  }, [isAuthenticated, pendingBooking, handlePostAuth]);


  const addBookingAndSaveTrip = (booking: Booking, tripToSave: Trip) => {
    const newBookings = [...bookings, booking];
    setBookings(newBookings);
    localStorage.setItem('wandergenie-bookings', JSON.stringify(newBookings));
    
    let updatedTrip = { ...tripToSave };

    if (booking.type === 'hotel') {
        const hotelName = (booking.item as HotelOption).name;
        let newItinerary = JSON.parse(JSON.stringify(tripToSave.itinerary));
        
        let activityReplaced = false;
        for (const day of newItinerary.dailyPlan) {
            for (const timeSlot of ['morning', 'afternoon', 'evening', 'night']) {
                if ((day as any)[timeSlot]) {
                    const accommodationActivityIndex = (day as any)[timeSlot].findIndex((activity: any) =>
                        activity.description.toLowerCase().includes('accommodation') ||
                        activity.description.toLowerCase().includes('hotel')
                    );
                    
                    if (accommodationActivityIndex !== -1) {
                        (day as any)[timeSlot][accommodationActivityIndex].description = `Check into **${hotelName}**`;
                        (day as any)[timeSlot][accommodationActivityIndex].location = `${hotelName}, ${tripToSave.destination}`;
                        activityReplaced = true;
                        break;
                    }
                }
            }
            if(activityReplaced) break;
        }

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

    addTrip(updatedTrip); // Save the (potentially updated) trip
    setCurrentTrip(updatedTrip); // Make it the active trip
  };
  
  const deleteBooking = (bookingId: string) => {
    const newBookings = bookings.filter(b => b.id !== bookingId);
    setBookings(newBookings);
    localStorage.setItem('wandergenie-bookings', JSON.stringify(newBookings));
  };

  const updateBookingInList = (updatedBooking: Booking) => {
    const bookingIndex = bookings.findIndex(b => b.id === updatedBooking.id);
    if(bookingIndex !== -1) {
        const newBookings = [...bookings];
        newBookings[bookingIndex] = updatedBooking;
        setBookings(newBookings);
        localStorage.setItem('wandergenie-bookings', JSON.stringify(newBookings));
    }
  };

  const getBookingById = (bookingId: string) => {
    return bookings.find(b => b.id === bookingId);
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
    updateBookingInList,
    getBookingById,
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

    