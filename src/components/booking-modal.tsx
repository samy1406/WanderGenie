
"use client";

import React from "react";
import { useBooking } from "@/context/booking-context";
import type { GetTravelOptionsOutput } from "@/ai/flows/get-travel-options";
import { useRouter } from "next/navigation";

type TravelOption = GetTravelOptionsOutput['travelOptions'][0];
type HotelOption = GetTravelOptionsOutput['hotelOptions'][0];

type BookingModalProps = {
  option: TravelOption | HotelOption;
  optionType: 'travel' | 'hotel';
  triggerButton: React.ReactNode;
  onBookingComplete?: (itemName: string) => void;
};

export function BookingModal({ option, optionType, triggerButton }: BookingModalProps) {
  const { setBookingOption } = useBooking();
  const router = useRouter();

  const handleBookNowClick = (e: React.MouseEvent) => {
    e.preventDefault(); 
    setBookingOption({
      item: option,
      type: optionType,
    });
    router.push('/book');
  };

  // Clone the trigger button and attach our onClick handler
  return React.cloneElement(triggerButton as React.ReactElement, {
    onClick: handleBookNowClick,
  });
}
