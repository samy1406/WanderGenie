// src/app/my-bookings/page.tsx
'use client';

import { useAuth } from '@/context/auth-context';
import { useBooking } from '@/context/booking-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import type { GetTravelOptionsOutput } from "@/ai/flows/get-travel-options";
import { FormatBoldText } from '@/components/format-bold-text';
import { User, Calendar, Plane, Hotel } from 'lucide-react';

type TravelOption = GetTravelOptionsOutput['travelOptions'][0];
type HotelOption = GetTravelOptionsOutput['hotelOptions'][0];

export default function MyBookingsPage() {
  const { isAuthenticated, user, isLoading } = useAuth();
  const { bookings } = useBooking();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || !isAuthenticated) {
    return <div className="text-center p-8">Loading...</div>;
  }
  
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-2">My Bookings</h1>
      <p className="text-muted-foreground mb-6">Welcome back, {user?.name}! Here are your trip details.</p>

      {bookings.length > 0 ? (
        <div className="space-y-6">
          {bookings.map((booking) => {
            const { item, type } = booking;
            return (
              <Card key={booking.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center text-2xl">
                          {booking.type === 'hotel' ? <Hotel className="mr-3 text-primary"/> : <Plane className="mr-3 text-primary"/> }
                          <FormatBoldText text={type === 'hotel' ? (item as HotelOption).name : (item as TravelOption).details} />
                      </CardTitle>
                      <CardDescription>
                        Booked on: {new Date(booking.bookingDate).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                        <p className="text-xl font-bold">{type === 'hotel' ? (item as HotelOption).pricePerNight : (item as TravelOption).cost}</p>
                        <p className="text-xs text-muted-foreground">Total Price</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Separator />
                  <div className="mt-4">
                    <h4 className="font-semibold mb-2 flex items-center"><User className="mr-2 h-4 w-4"/>Passengers</h4>
                    <ul className="list-disc list-inside text-muted-foreground">
                      {booking.passengerDetails.passengers.map((p, i) => (
                        <li key={i}>{p.firstName} {p.lastName}</li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            )
          })}
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
