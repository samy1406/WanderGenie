
// src/app/my-trips/page.tsx
'use client';

import { useAuth } from '@/context/auth-context';
import { useTrip, type Trip } from '@/context/trip-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Backpack, Trash2, ArrowRight } from 'lucide-react';

function TripCard({ trip, onDelete, onView }: { trip: Trip, onDelete: (id: string) => void, onView: (trip: Trip) => void }) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <CardTitle>{trip.name}</CardTitle>
        <CardDescription>Created on: {new Date(trip.createdAt).toLocaleDateString()}</CardDescription>
      </CardHeader>
      <CardContent className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">{trip.itinerary.dailyPlan.length}-day trip from {trip.origin}</p>
        <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={() => onDelete(trip.id)}>
                <Trash2 className="h-4 w-4" />
            </Button>
            <Button onClick={() => onView(trip)}>
                View Plan <ArrowRight className="ml-2 h-4 w-4"/>
            </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default function MyTripsPage() {
  const { isAuthenticated, user, isLoading } = useAuth();
  const { trips, deleteTrip, setSelectedTrip } = useTrip();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, isLoading, router]);

  const handleViewTrip = (trip: Trip) => {
    setSelectedTrip(trip);
    router.push('/');
  }

  if (isLoading || !isAuthenticated) {
    return <div className="text-center p-8">Loading...</div>;
  }
  
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-2 flex items-center"><Backpack className="mr-3 h-8 w-8"/>My Saved Trips</h1>
      <p className="text-muted-foreground mb-6">Here are all the adventures you've planned.</p>

      {trips.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {trips.map((trip) => (
              <TripCard key={trip.id} trip={trip} onDelete={deleteTrip} onView={handleViewTrip}/>
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
