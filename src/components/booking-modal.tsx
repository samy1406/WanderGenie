
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

type TravelOption = GetTravelOptionsOutput['travelOptions'][0];
type HotelOption = GetTravelOptionsOutput['hotelOptions'][0];

type BookingModalProps = {
  option: TravelOption | HotelOption;
  optionType: 'travel' | 'hotel';
  triggerButton: React.ReactNode;
  onBookingComplete?: (itemName: string) => void;
};

export function BookingModal({ option, optionType, triggerButton, onBookingComplete }: BookingModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<"details" | "booking" | "payment" | "confirmation">("details");
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [cardholderName, setCardholderName] = useState("");
  const { toast } = useToast();

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      // Reset state on close
      setTimeout(() => {
        setStep("details");
        setBookingId(null);
        setTransactionId(null);
        setCardholderName("");
      }, 300);
    }
    setIsOpen(open);
  };

  const startBookingProcess = async () => {
    setStep("booking");
    try {
      const item = optionType === 'hotel' ? (option as HotelOption).name : (option as TravelOption).details;
      const details = optionType === 'hotel' ? `Rating: ${(option as HotelOption).rating}, Price: ${(option as HotelOption).pricePerNight}` : `Mode: ${(option as TravelOption).mode}, Cost: ${(option as TravelOption).cost}`;
      
      const result = await handleBookingRequest({ item, details });
      if (result.success) {
        setBookingId(result.bookingId);
        setStep("payment");
      } else {
        throw new Error("Booking failed on the server.");
      }
    } catch (error) {
      toast({
        title: "Booking Failed",
        description: "We couldn't complete your booking. Please try again.",
        variant: "destructive",
      });
      setStep("details");
    }
  };

  const startPaymentProcess = async () => {
    if (!bookingId || !cardholderName) {
      toast({ title: "Payment Error", description: "Please enter the cardholder name.", variant: "destructive"});
      return;
    }
    setStep("booking"); // Show loader again for payment
    try {
      const result = await handlePaymentRequest({ bookingId, cardholderName });
      if (result.success && result.transactionId) {
        setTransactionId(result.transactionId);
        setStep("confirmation");
         if (optionType === 'hotel' && onBookingComplete) {
          onBookingComplete((option as HotelOption).name);
        }
      } else {
        throw new Error("Payment failed on the server.");
      }
    } catch (error) {
      toast({
        title: "Payment Failed",
        description: "We couldn't process your payment. Please try again.",
        variant: "destructive",
      });
      setStep("payment"); // Return to payment step on failure
    }
  };
  
  const renderContent = () => {
    switch (step) {
      case "details":
        return (
          <>
            <DialogHeader>
              <DialogTitle>Confirm Your Booking</DialogTitle>
              <DialogDescription>
                You are about to book the following option. Please review the details below.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-2">
              <h4 className="font-semibold">
                {optionType === 'hotel' ? <FormatBoldText text={(option as HotelOption).name} /> : `${(option as TravelOption).mode}: ${(option as TravelOption).details}`}
              </h4>
              <p className="text-sm text-muted-foreground">
                {optionType === 'hotel' ? `Price: ${(option as HotelOption).pricePerNight}` : `Cost: ${(option as TravelOption).cost}, Duration: ${(option as TravelOption).duration}`}
              </p>
            </div>
            <DialogFooter>
              <Button onClick={startBookingProcess}>Confirm & Proceed to Payment</Button>
            </DialogFooter>
          </>
        );
      case "booking":
        return (
          <div className="flex flex-col items-center justify-center gap-4 py-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-muted-foreground">
              {bookingId ? "Processing your payment..." : "Confirming your booking..."}
            </p>
          </div>
        );
      case "payment":
        return (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><CheckCircle className="text-green-500"/> Booking Confirmed!</DialogTitle>
              <DialogDescription>
                Your booking ID is <span className="font-semibold text-primary">{bookingId}</span>. Please complete the payment.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="cardholderName">Cardholder Name</Label>
                <Input id="cardholderName" placeholder="e.g., Jane Doe" value={cardholderName} onChange={e => setCardholderName(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>Card Number</Label>
                <div className="flex items-center gap-2 rounded-md border border-input p-2">
                  <CreditCard className="text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">**** **** **** 1234 (mock)</p>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={startPaymentProcess}>Pay Now</Button>
            </DialogFooter>
          </>
        );
      case "confirmation":
        return (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-green-600"><PartyPopper/> Payment Successful!</DialogTitle>
              <DialogDescription>
                Your trip is booked! Get ready for your adventure.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-2 text-sm">
                <p><strong>Booking ID:</strong> <span className="font-mono text-primary">{bookingId}</span></p>
                <p><strong>Transaction ID:</strong> <span className="font-mono text-primary">{transactionId}</span></p>
            </div>
            <DialogFooter>
              <Button onClick={() => handleOpenChange(false)}>Done</Button>
            </DialogFooter>
          </>
        );
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{triggerButton}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
}
