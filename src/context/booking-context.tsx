// src/context/booking-context.tsx
'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { GetTravelOptionsOutput } from '@/ai/flows/get-travel-options';

type TravelOption = GetTravelOptionsOutput['travelOptions'][0];
type HotelOption = GetTravelOptionsOutput['hotelOptions'][0];

type BookingItem = {
    item: TravelOption | HotelOption;
    type: 'travel' | 'hotel';
}

type PassengerDetails = {
    passengers: {
      firstName: string;
      lastName: string;
      age: number;
    }[];
    email: string;
    phone: string;
};

export type Booking = BookingItem & {
    id: string;
    passengerDetails: PassengerDetails;
    bookingDate: string;
};


type BookingContextType = {
  bookingOption: BookingItem | null;
  setBookingOption: (option: BookingItem | null) => void;
  bookings: Booking[];
  addBooking: (booking: Booking) => void;
  pendingBooking: Booking | null;
  setPendingBooking: (booking: Booking | null) => void;
  clearPendingBooking: () => void;
};

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export function BookingProvider({ children }: { children: ReactNode }) {
  const [bookingOption, setBookingOption] = useState<BookingItem | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [pendingBooking, setPendingBooking] = useState<Booking | null>(null);
  
  useEffect(() => {
    const storedBookings = localStorage.getItem('wandergenie-bookings');
    if (storedBookings) {
      setBookings(JSON.parse(storedBookings));
    }
  }, []);

  const addBooking = (booking: Booking) => {
    const newBookings = [...bookings, booking];
    setBookings(newBookings);
    localStorage.setItem('wandergenie-bookings', JSON.stringify(newBookings));
  };
  
  const clearPendingBooking = () => {
    setPendingBooking(null);
  };

  const value = {
    bookingOption,
    setBookingOption,
    bookings,
    addBooking,
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

    