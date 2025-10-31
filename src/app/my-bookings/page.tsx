
// src/app/my-bookings/page.tsx
'use client';

import { useAuth } from '@/context/auth-context';
import { useBooking } from '@/context/booking-context';
import ItineraryDisplay from '@/components/itinerary-display';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import type { GetTravelOptionsOutput } from "@/ai/flows/get-travel-options";
import { FormatBoldText } from '@/components/format-bold-text';
import { User, Calendar, Plane, Hotel, IndianRupee, Trash2, AlertTriangle } from 'lucide-react';
import type { Booking } from '@/context/booking-context';
import { formatCurrency } from '@/lib/formatters';
import type { GeneratePersonalizedItineraryOutput } from '@/ai/flows/generate-personalized-itinerary';
import { handleGenerateItinerary } from '@/app/actions';
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

function BookingCard({ 
  booking, 
  onItineraryUpdate,
  onCancelBooking
}: { 
  booking: Booking; 
  onItineraryUpdate: (bookingId: string, itinerary: GeneratePersonalizedItineraryOutput) => void;
  onCancelBooking: (bookingId: string) => void;
}) {
  const { item, type } = booking;
  const [itinerary, setItinerary] = useState<GeneratePersonalizedItineraryOutput | null>(booking.itinerary || null);
  const [isLoadingItinerary, setIsLoadingItinerary] = useState(false);
  
  const generateItineraryForBooking = async () => {
    if (booking.type !== 'travel') return;

    setIsLoadingItinerary(true);
    try {
        const travelOption = booking.item as TravelOption;
        const result = await handleGenerateItinerary({
            destination: travelOption.details.split(' to ')[1] || 'your destination',
            tripDuration: 3, // Default duration for booked trips
            interests: 'A mix of popular sights and local experiences',
            travelPreference: 'comfort',
        });
        setItinerary(result);
        onItineraryUpdate(booking.id, result);
    } catch (error) {
        console.error("Failed to generate itinerary for booking", error);
    } finally {
        setIsLoadingItinerary(false);
    }
  }

  if(itinerary) {
     return <ItineraryDisplay 
        itineraryData={itinerary}
        destination={itinerary.dailyPlan[0]?.afternoon?.[0]?.location || 'Destination'}
        origin={'Your Location'} // This might need to be dynamic
        onItineraryUpdate={(newItinerary) => {
            setItinerary(newItinerary);
            onItineraryUpdate(booking.id, newItinerary);
        }}
        showSaveButton={false}
     />
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center text-2xl">
              {booking.type === 'hotel' ? <Hotel className="mr-3 text-primary" /> : <Plane className="mr-3 text-primary" />}
              <FormatBoldText text={type === 'hotel' ? (item as HotelOption).name : (item as TravelOption).details} />
            </CardTitle>
            <CardDescription>
              Booked on: {new Date(booking.bookingDate).toLocaleDateString()}
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
      <CardContent>
        <Separator />
        <div className="grid md:grid-cols-2 gap-6 mt-4">
            <div>
                <h4 className="font-semibold mb-2 flex items-center"><User className="mr-2 h-4 w-4" />Passengers</h4>
                <ul className="list-disc list-inside text-muted-foreground">
                {booking.passengerDetails.passengers.map((p, i) => (
                    <li key={i}>{p.firstName} {p.lastName}</li>
                ))}
                </ul>
            </div>
             <div className="flex flex-col items-end h-full justify-center gap-4">
                {booking.type === 'travel' && !itinerary && (
                     <>
                        <p className="text-sm text-muted-foreground">Ready to plan the details for this trip?</p>
                        <Button onClick={generateItineraryForBooking} disabled={isLoadingItinerary}>
                           {isLoadingItinerary ? 'Generating...' : 'Generate Full Itinerary'}
                        </Button>
                    </>
                )}
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
            </div>
        </div>
      </CardContent>
    </Card>
  )
}


export default function MyBookingsPage() {
  const { isAuthenticated, user, isLoading } = useAuth();
  const { bookings, updateBookingInList, deleteBooking } = useBooking();
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

  const handleItineraryUpdate = (bookingId: string, itinerary: GeneratePersonalizedItineraryOutput) => {
    const bookingToUpdate = bookings.find(b => b.id === bookingId);
    if(bookingToUpdate) {
        updateBookingInList({...bookingToUpdate, itinerary });
    }
  }

  const handleCancelBooking = (bookingId: string) => {
    deleteBooking(bookingId);
    toast({
        title: "Booking Cancelled",
        description: "Your booking has been successfully cancelled."
    })
  }

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
                onItineraryUpdate={handleItineraryUpdate}
                onCancelBooking={handleCancelBooking}
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
