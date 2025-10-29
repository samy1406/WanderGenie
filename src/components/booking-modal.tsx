
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

type TravelOption = GetTravelOptionsOutput['travelOptions'][0];
type HotelOption = GetTravelOptionsOutput['hotelOptions'][0];

type BookingModalProps = {
  option: TravelOption | HotelOption;
  optionType: 'travel' | 'hotel';
  triggerButton: React.ReactNode;
  onBookingComplete?: (itemName: string) => void;
};

export function BookingModal({ option, optionType, triggerButton, onBookingComplete }: BookingModalProps) {
  const router = useRouter();
  const { setBookingOption } = useBooking();

  const handleBookNowClick = () => {
    setBookingOption({
      item: option,
      type: optionType,
    });
    router.push('/book');
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {React.cloneElement(triggerButton as React.ReactElement, { onClick: handleBookNowClick })}
      </DialogTrigger>
    </Dialog>
  );
}
