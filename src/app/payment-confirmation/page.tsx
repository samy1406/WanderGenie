
// src/app/payment-confirmation/page.tsx
'use client';

import { useBooking } from '@/context/booking-context';
import { useAuth } from '@/context/auth-context';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { CheckCircle2, User, Home, Plane, Building, IndianRupee, ArrowLeft, Ticket, Shield, Train, Bus, Briefcase } from 'lucide-react';
import type { Booking, Passenger } from '@/context/booking-context';
import { FormatBoldText } from '@/components/format-bold-text';
import type { GetTravelOptionsOutput } from '@/ai/flows/get-travel-options';
import { formatCurrency } from '@/lib/formatters';
import { useTrip } from '@/context/trip-context';

type TravelOption = GetTravelOptionsOutput['travelOptions'][0];
type HotelOption = GetTravelOptionsOutput['hotelOptions'][0];

const iconMap: { [key: string]: React.ReactElement } = {
    Flight: <Plane className="h-8 w-8 text-primary" />,
    Train: <Train className="h-8 w-8 text-primary" />,
    Bus: <Bus className="h-8 w-8 text-primary" />,
    hotel: <Building className="h-8 w-8 text-primary" />,
};

const getIconForBooking = (booking: Booking) => {
    if (booking.type === 'hotel') return iconMap.hotel;
    const travelOption = booking.item as TravelOption;
    return iconMap[travelOption.mode] || <Briefcase className="h-8 w-8 text-primary" />;
}


function ConfirmationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('bookingId');
  const { getBookingById } = useBooking();
  const { user } = useAuth();
  const { clearCurrentTrip } = useTrip();
  
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);

  useEffect(() => {
    if (bookingId) {
      const foundBooking = getBookingById(bookingId);
      if(foundBooking) {
        setConfirmedBooking(foundBooking);
      } else {
        // Handle case where booking is not found, maybe redirect or show error
        router.push('/my-bookings');
      }
    } else {
       router.push('/');
    }
  }, [bookingId, getBookingById, router]);

  const handleReturnToTrip = () => {
    clearCurrentTrip(false); // don't clear the selected trip, just go back
    router.push('/');
  }

  if (!confirmedBooking) {
    return <div className="text-center p-8">Loading booking confirmation...</div>;
  }

  const { id, transactionId, passengerDetails, bookingDate, amountPaid, item, type, seatDetails, insuranceDetails } = confirmedBooking;
  const isHotel = type === 'hotel';
  const itemDetails = item as (TravelOption | HotelOption);

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card className="max-w-4xl mx-auto">
            <CardHeader className="text-center bg-green-50/50 p-8">
                <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <CardTitle className="text-3xl font-bold text-green-700">Booking Confirmed!</CardTitle>
                <CardDescription className="text-lg">
                    Thank you, {user?.name}! Your trip is officially booked.
                </CardDescription>
            </CardHeader>
            <CardContent className="p-8">
                <div className="grid md:grid-cols-2 gap-8 mb-8">
                    <div>
                        <h3 className="font-semibold text-muted-foreground">Booking ID</h3>
                        <p className="font-mono text-lg">{id}</p>
                    </div>
                    <div className="text-right">
                         <h3 className="font-semibold text-muted-foreground">Transaction ID</h3>
                        <p className="font-mono text-lg">{transactionId}</p>
                    </div>
                </div>

                <Separator className="my-6" />

                <div className="flex items-center gap-4 mb-6">
                    <div className="bg-primary/10 p-4 rounded-lg">
                        {getIconForBooking(confirmedBooking)}
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold"><FormatBoldText text={isHotel ? (itemDetails as HotelOption).name : (itemDetails as TravelOption).details} /></h2>
                        <p className="text-muted-foreground">Booked on {new Date(bookingDate).toLocaleString()}</p>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                     <Card className="bg-secondary/50">
                        <CardHeader>
                            <CardTitle className="flex items-center text-lg"><User className="mr-2"/>Passenger Details</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-2">
                                {passengerDetails.passengers.map((p: Passenger, i: number) => (
                                    <li key={i}>{p.title} {p.firstName} {p.lastName} ({p.gender}, Age: {p.age})</li>
                                ))}
                            </ul>
                            <Separator className="my-4" />
                            <p><strong>Email:</strong> {passengerDetails.email}</p>
                            <p><strong>Phone:</strong> {passengerDetails.phone}</p>
                        </CardContent>
                     </Card>
                      <Card className="bg-secondary/50">
                        <CardHeader>
                            <CardTitle className="flex items-center text-lg">
                                <IndianRupee className="mr-2 h-5 w-5"/>Payment Summary
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                           <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span>Total Amount Paid:</span>
                                    <span className="font-bold text-xl flex items-center"><IndianRupee className="h-5 w-5 mr-1"/>{formatCurrency(amountPaid)}</span>
                                </div>
                                <p className="text-xs text-muted-foreground text-right">via Mock Payment Gateway</p>
                           </div>
                        </CardContent>
                     </Card>
                     {seatDetails && (
                        <Card className="bg-secondary/50">
                            <CardHeader>
                                <CardTitle className="flex items-center text-lg"><Ticket className="mr-2"/>Seat Details</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p><strong>PNR:</strong> <span className="font-mono">{seatDetails.pnr}</span></p>
                                <p><strong>Seats:</strong> <span className="font-mono">{seatDetails.seats.join(', ')}</span></p>
                            </CardContent>
                        </Card>
                     )}
                     {insuranceDetails && (
                         <Card className="bg-secondary/50">
                            <CardHeader>
                                <CardTitle className="flex items-center text-lg"><Shield className="mr-2"/>Insurance Details</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p><strong>Policy ID:</strong> <span className="font-mono">{insuranceDetails.policyId}</span></p>
                                <p><strong>Provider:</strong> {insuranceDetails.provider}</p>
                                <p><strong>Coverage:</strong> <IndianRupee className="h-4 w-4 inline"/> {formatCurrency(insuranceDetails.coverageAmount)}</p>
                            </CardContent>
                        </Card>
                     )}
                </div>

                <div className="mt-8 text-center flex flex-col sm:flex-row justify-center gap-4">
                    <Button onClick={handleReturnToTrip}><ArrowLeft className="mr-2 h-4 w-4"/> Return to Trip Plan</Button>
                    <Button variant="outline" onClick={() => router.push('/my-bookings')}>View All Bookings</Button>
                    <Button variant="outline" onClick={() => router.push('/')}><Home className="mr-2"/>Plan Another Trip</Button>
                </div>

                 <p className="text-center text-xs text-muted-foreground mt-8">A confirmation email with your ticket has been sent to {passengerDetails.email}.</p>
            </CardContent>
        </Card>
    </div>
  );
}


export default function PaymentConfirmationPage() {
    return (
        <Suspense fallback={<div className="text-center p-8">Loading confirmation...</div>}>
            <ConfirmationContent />
        </Suspense>
    )
}
