
"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import { useBooking } from "@/context/booking-context";
import type { GetTravelOptionsOutput } from "@/ai/flows/get-travel-options";
import Link from "next/link";

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

  const handleBookNowClick = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent default link behavior if it's wrapped in one
    setBookingOption({
      item: option,
      type: optionType,
    });
    // Navigation is now handled by the Link component
  };

  return (
    <Link href="/book" onClick={handleBookNowClick} passHref>
        {React.cloneElement(triggerButton as React.ReactElement)}
    </Link>
  );
}
