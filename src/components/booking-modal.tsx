
"use client";

import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { handleBookingRequest, handlePaymentRequest } from "@/app/actions";
import { Loader2, CheckCircle, CreditCard, PartyPopper } from "lucide-react";
import type { GetTravelOptionsOutput } from "@/ai/flows/get-travel-options";
import { FormatBoldText } from "./format-bold-text";
import { useRouter } from "next/navigation";
import { useBooking } from "@/context/booking-context";

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
