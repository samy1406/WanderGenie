
// src/app/my-bookings/page.tsx
'use client';

import React from 'react';
import { useAuth } from '@/context/auth-context';
import { useBooking, type Booking, type Passenger, type SeatDetails, type InsuranceDetails } from '@/context/booking-context';
import { useTrip } from '@/context/trip-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import type { GetTravelOptionsOutput } from "@/ai/flows/get-travel-options";
import { FormatBoldText } from '@/components/format-bold-text';
import { User, Calendar, Plane, Hotel, IndianRupee, Trash2, AlertTriangle, Briefcase, Ticket, Bus, Train, Shield, ArrowRight } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useToast } from '@/hooks/use-toast';

type TravelOption = GetTravelOptionsOutput['travelOptions'][0];
type HotelOption = GetTravelOptionsOutput['hotelOptions'][0];

const iconMap: { [key: string]: React.ReactElement } = {
    Flight: <Plane className="mr-3 h-6 w-6 text-primary" />,
    Train: <Train className="mr-3 h-6 w-6 text-primary" />,
    Bus: <Bus className="mr-3 h-6 w-6 text-primary" />,
    hotel: <Hotel className="mr-3 h-6 w-6 text-primary" />,
};

const getIconForBooking = (booking: Booking) => {
    if (booking.type === 'hotel') return iconMap.hotel;
    const travelOption = booking.item as TravelOption;
    return iconMap[travelOption.mode] || <Briefcase className="mr-3 h-6 w-6 text-primary" />;
}

function BookingCard({ 
  booking,
  onCancelBooking,
  onViewTrip
}: { 
  booking: Booking; 
  onCancelBooking: (bookingId: string) => void;
  onViewTrip: (bookingId: string) => void;
}) {
  const { item, type, passengerDetails, bookingDate, transactionId, amountPaid, seatDetails, insuranceDetails } = booking;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-secondary/30">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center text-2xl">
              {getIconForBooking(booking)}
              <FormatBoldText text={type === 'hotel' ? (item as HotelOption).name : (item as TravelOption).details} />
            </CardTitle>
            <CardDescription className="flex items-center gap-4 mt-2">
                <span>Booked on: {new Date(booking.bookingDate).toLocaleDateString()}</span>
                <span className="font-mono text-xs bg-primary/10 text-primary-foreground px-2 py-0.5 rounded-full">ID: {booking.id}</span>
            </CardDescription>
          </div>
          <div className="text-right">
            <p className="flex items-center text-xl font-bold">
                <IndianRupee className="h-5 w-5 mr-1"/>
                {formatCurrency(booking.amountPaid)}
            </p>
            <p className="text-xs text-muted-foreground">Total Price</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
                <h4 className="font-semibold mb-2 flex items-center"><User className="mr-2 h-4 w-4 text-muted-foreground" />Passengers</h4>
                <ul className="space-y-1 text-sm text-foreground/90">
                {passengerDetails.passengers.map((p, i) => (
                    <li key={i}>{p.title}. {p.firstName} {p.lastName}</li>
                ))}
                </ul>
            </div>
            {seatDetails && (
                 <div>
                    <h4 className="font-semibold mb-2 flex items-center"><Ticket className="mr-2 h-4 w-4 text-muted-foreground" />Seat Details</h4>
                    <p className="text-sm"><strong>PNR:</strong> <span className="font-mono">{seatDetails.pnr}</span></p>
                    <p className="text-sm"><strong>Seats:</strong> <span className="font-mono">{seatDetails.seats.join(', ')}</span></p>
                </div>
            )}
             {insuranceDetails && (
                 <div>
                    <h4 className="font-semibold mb-2 flex items-center"><Shield className="mr-2 h-4 w-4 text-muted-foreground" />Insurance</h4>
                    <p className="text-sm"><strong>Policy ID:</strong> <span className="font-mono">{insuranceDetails.policyId}</span></p>
                    <p className="text-sm"><strong>Provider:</strong> {insuranceDetails.provider}</p>
                    <p className="text-sm"><strong>Coverage:</strong> <IndianRupee className="inline h-3 w-3"/>{formatCurrency(insuranceDetails.coverageAmount)}</p>
                </div>
            )}
             <div className="md:col-span-full lg:col-span-1 lg:col-start-3">
                <h4 className="font-semibold mb-2 flex items-center"><Briefcase className="mr-2 h-4 w-4 text-muted-foreground" />Transaction</h4>
                <p className="text-sm"><strong>TXN ID:</strong> <span className="font-mono">{transactionId}</span></p>
                <p className="text-sm"><strong>Date:</strong> {new Date(bookingDate).toLocaleString()}</p>
            </div>
        </div>
      </CardContent>
      <CardFooter className="bg-secondary/30 p-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => onViewTrip(booking.id)}>
                <ArrowRight className="mr-2 h-4 w-4" /> View Trip Plan
            </Button>
            <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="destructive">
                    <Trash2 className="mr-2 h-4 w-4" /> Cancel Booking
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center"><AlertTriangle className="mr-2 text-destructive" />Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action cannot be undone. This will permanently cancel your booking. 
                    Cancellation is free for WanderGenie Beta. In a real app, policies would apply.
                </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                <AlertDialogCancel>Keep Booking</AlertDialogCancel>
                <AlertDialogAction onClick={() => onCancelBooking(booking.id)} className="bg-destructive hover:bg-destructive/90">
                    Yes, Cancel It
                </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  )
}


export default function MyBookingsPage() {
  const { isAuthenticated, user, isLoading } = useAuth();
  const { bookings, deleteBooking } = useBooking();
  const { trips, setCurrentTrip } = useTrip();
  const router = useRouter();
  const { toast } = useToast();
  const [userBookings, setUserBookings] = useState<Booking[]>([]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/');
    } else if (user) {
      const filteredBookings = bookings.filter(booking => booking.passengerDetails.email === user.email);
      setUserBookings(filteredBookings);
    }
  }, [isAuthenticated, isLoading, router, user, bookings]);


  const handleCancelBooking = (bookingId: string) => {
    // In a real app, this would involve API calls, checking refund policies etc.
    // Standard practice: Often non-refundable or partially refundable depending on time.
    // For this app, we assume a 100% refund for beta.
    const bookingToCancel = bookings.find(b => b.id === bookingId);
    if (!bookingToCancel) return;

    const refundAmount = bookingToCancel.amountPaid || 0;

    deleteBooking(bookingId);

    toast({
        title: "Booking Cancelled",
        description: <>Your booking has been cancelled. A refund of <IndianRupee className="inline h-4 w-4"/>{formatCurrency(refundAmount)} has been initiated.</>,
    })
  }

  const handleViewTrip = (bookingId: string) => {
    // Find the trip associated with this booking
    const tripForBooking = trips.find(trip => 
        (trip.outboundTravelOptions && trip.outboundTravelOptions.travelOptions.some(opt => opt.details === (bookings.find(b => b.id === bookingId)?.item as TravelOption).details)) ||
        (trip.outboundTravelOptions && trip.outboundTravelOptions.hotelOptions.some(opt => opt.name === (bookings.find(b => b.id === bookingId)?.item as HotelOption).name))
    );

    if (tripForBooking) {
        setCurrentTrip(tripForBooking);
        router.push('/');
    } else {
        toast({
            title: "Trip Plan Not Found",
            description: "We couldn't find the saved trip plan associated with this booking.",
            variant: "destructive"
        });
    }
  };

  if (isLoading || !isAuthenticated) {
    return <div className="text-center p-8">Loading...</div>;
  }
  
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-2">My Bookings</h1>
      <p className="text-muted-foreground mb-6">Welcome back, {user?.name}! Here are your trip details.</p>

      {userBookings.length > 0 ? (
        <div className="space-y-6">
          {userBookings.map((booking) => (
              <BookingCard 
                key={booking.id} 
                booking={booking} 
                onCancelBooking={handleCancelBooking}
                onViewTrip={handleViewTrip}
              />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
          <h2 className="text-xl font-semibold text-muted-foreground">You have no bookings yet.</h2>
          <p className="mt-2 text-muted-foreground">Ready to plan your next adventure?</p>
          <Button onClick={() => router.push('/')} className="mt-4">Plan a Trip</Button>
        </div>
      )}
    </div>
  );
}

    