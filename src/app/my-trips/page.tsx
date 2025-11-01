
// src/app/my-trips/page.tsx
'use client';

import { useAuth } from '@/context/auth-context';
import { useTrip, type Trip } from '@/context/trip-context';
import { useBooking, type Booking } from '@/context/booking-context';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Backpack, Trash2, ArrowRight, Plane, Hotel, CheckCircle, Clock } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import type { GetTravelOptionsOutput } from '@/ai/flows/get-travel-options';
import { useToast } from '@/hooks/use-toast';

type TravelOption = GetTravelOptionsOutput['travelOptions'][0];
type HotelOption = GetTravelOptionsOutput['hotelOptions'][0];


function TripCard({ trip, onDelete, onViewPlan, onCompleteBookings }: { 
  trip: Trip, 
  onDelete: (id: string) => void, 
  onViewPlan: (trip: Trip) => void,
  onCompleteBookings: (trip: Trip) => void
}) {
  const { getBookingsForTrip } = useBooking();
  const tripBookings = useMemo(() => getBookingsForTrip(trip.id), [getBookingsForTrip, trip.id]);

  const departureBooking = tripBookings.find(b => 
    b.type === 'travel' && 
    trip.outboundTravelOptions?.travelOptions.some(opt => opt.details === (b.item as TravelOption).details)
  );

  const returnBooking = trip.returnDate ? tripBookings.find(b =>
    b.type === 'travel' &&
    trip.returnTravelOptions?.travelOptions.some(opt => opt.details === (b.item as TravelOption).details)
  ) : undefined;
  
  const hotelBooking = tripBookings.find(b => b.type === 'hotel');

  const isComplete = useMemo(() => {
    const hasReturn = !!trip.returnDate;
    return !!departureBooking && !!hotelBooking && (!hasReturn || !!returnBooking);
  }, [trip.returnDate, departureBooking, hotelBooking, returnBooking]);


  const BookingStatus = ({ label, isBooked }: { label: string, isBooked: boolean }) => (
    <div className="flex items-center gap-2 text-sm">
      {isBooked ? (
        <CheckCircle className="h-5 w-5 text-green-500" />
      ) : (
        <Clock className="h-5 w-5 text-amber-500" />
      )}
      <span className={isBooked ? 'text-muted-foreground' : 'font-semibold'}>{label}</span>
      <span className={`font-bold ${isBooked ? 'text-green-600' : 'text-amber-600'}`}>
        {isBooked ? 'Booked' : 'Pending'}
      </span>
    </div>
  );

  return (
    <Card className="hover:shadow-md transition-shadow flex flex-col">
      <CardHeader>
        <CardTitle>{trip.name}</CardTitle>
        <CardDescription>Created on: {new Date(trip.createdAt).toLocaleDateString()}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <Separator className="mb-4"/>
        <div className="space-y-3">
          <BookingStatus label="Departure" isBooked={!!departureBooking} />
          {trip.returnDate && <BookingStatus label="Return" isBooked={!!returnBooking} />}
          <BookingStatus label="Hotel" isBooked={!!hotelBooking} />
        </div>
      </CardContent>
      <CardFooter className="bg-secondary/30 p-4 flex flex-col sm:flex-row justify-end gap-2">
         <Button variant="outline" onClick={() => onViewPlan(trip)}>View Plan</Button>
         <Button onClick={() => onCompleteBookings(trip)} disabled={isComplete}>
            {isComplete ? 'View Bookings' : 'Complete Bookings'}
            {!isComplete && <ArrowRight className="ml-2 h-4 w-4"/>}
         </Button>
         <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="destructive" size="icon">
                    <Trash2 className="h-4 w-4" />
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will permanently delete this trip and all its associated data. This action cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onDelete(trip.id)} className="bg-destructive hover:bg-destructive/90">
                        Yes, Delete
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
         </AlertDialog>
      </CardFooter>
    </Card>
  )
}


// Dummy Alert Dialog components for type-checking if not globally available
const AlertDialog = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;
const AlertDialogTrigger = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;
const AlertDialogContent = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;
const AlertDialogHeader = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;
const AlertDialogTitle = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;
const AlertDialogDescription = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;
const AlertDialogFooter = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;
const AlertDialogCancel = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;
const AlertDialogAction = ({ children, onClick, className }: { children: React.ReactNode, onClick: () => void, className: string }) => <div onClick={onClick}>{children}</div>;


export default function MyTripsPage() {
  const { isAuthenticated, user, isLoading } = useAuth();
  const { trips, deleteTrip, setCurrentTrip } = useTrip();
  const router = useRouter();
  const {toast} = useToast();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, isLoading, router]);

  const handleViewPlan = (trip: Trip) => {
    setCurrentTrip(trip);
    router.push('/'); // Navigate to main page where trip plan is displayed
  }

  const handleCompleteBookings = (trip: Trip) => {
    setCurrentTrip(trip);
    // Directly navigate to the booking view, which needs to be handled in the main page
    // We can use a query param or a temporary state in a context
    // For now, let's just go to the main page and assume it will open the booking view.
    router.push('/?view=book'); 
    // In TripPlanner, we'll need to read this param and set viewState='BOOK'
  };
  
  const handleDeleteTrip = (tripId: string) => {
    deleteTrip(tripId);
    toast({
        title: "Trip Deleted",
        description: "Your trip has been successfully removed."
    })
  }

  if (isLoading || !isAuthenticated) {
    return <div className="text-center p-8">Loading...</div>;
  }
  
  const userTrips = trips.filter(trip => trip.userId === user?.id);

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-2 flex items-center"><Backpack className="mr-3 h-8 w-8"/>My Saved Trips</h1>
      <p className="text-muted-foreground mb-6">Here are all the adventures you've planned.</p>

      {userTrips.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {userTrips.map((trip) => (
              <TripCard 
                key={trip.id} 
                trip={trip} 
                onDelete={handleDeleteTrip} 
                onViewPlan={handleViewPlan}
                onCompleteBookings={handleCompleteBookings}
              />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
          <h2 className="text-xl font-semibold text-muted-foreground">You have no saved trips yet.</h2>
          <p className="mt-2 text-muted-foreground">Go back to the homepage to plan your next adventure!</p>
          <Button onClick={() => router.push('/')} className="mt-4">Plan a Trip</Button>
        </div>
      )}
    </div>
  );
}
