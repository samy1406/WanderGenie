
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

export type Booking = BookingItem & {
    id: string;
    passengerDetails: PassengerDetails;
    bookingDate: string;
    transactionId?: string;
    amountPaid?: number;
};


type BookingContextType = {
  bookingOption: BookingItem | null;
  setBookingOption: (option: BookingItem | null) => void;
  bookings: Booking[];
  addBooking: (booking: Booking) => void;
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

  const addBooking = (booking: Booking) => {
    const newBookings = [...bookings, booking];
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
    addBooking,
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
