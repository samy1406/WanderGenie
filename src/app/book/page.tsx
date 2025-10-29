// src/app/book/page.tsx
'use client';

import { useBooking } from '@/context/booking-context';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { PlusCircle, Trash2, User, Mail, Phone, ArrowRight } from 'lucide-react';
import { AuthModal } from '@/components/auth-modal';
import type { GetTravelOptionsOutput } from '@/ai/flows/get-travel-options';
import { FormatBoldText } from '@/components/format-bold-text';

type TravelOption = GetTravelOptionsOutput['travelOptions'][0];
type HotelOption = GetTravelOptionsOutput['hotelOptions'][0];

const passengerSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
});

const bookingFormSchema = z.object({
  passengers: z.array(passengerSchema).min(1, 'At least one passenger is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Invalid phone number'),
});

export default function BookPage() {
  const router = useRouter();
  const { bookingOption, addBooking, setPendingBooking } = useBooking();
  const { isAuthenticated, user, openAuthModal } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const form = useForm<z.infer<typeof bookingFormSchema>>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      passengers: [{ firstName: '', lastName: '' }],
      email: '',
      phone: '',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'passengers',
  });
  
  // Set default email if user is logged in
  useEffect(() => {
    if (isAuthenticated && user) {
      form.setValue('email', user.email);
    }
  }, [isAuthenticated, user, form]);

  if (!bookingOption) {
    useEffect(() => {
      router.push('/');
    }, [router]);
    return <div className="text-center p-8">No booking option selected. Redirecting...</div>;
  }
  
  const onSubmit = (data: z.infer<typeof bookingFormSchema>) => {
    const newBooking = {
      ...bookingOption,
      passengerDetails: data,
      bookingDate: new Date().toISOString(),
      id: `booking_${Date.now()}`
    };

    if (isAuthenticated) {
      addBooking(newBooking);
      router.push('/my-bookings');
    } else {
      setPendingBooking(newBooking);
      openAuthModal();
    }
  };

  const { item, type } = bookingOption;

  return (
    <>
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <h1 className="text-3xl font-bold mb-6">Complete Your Booking</h1>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center"><User className="mr-2"/> Passenger Details</CardTitle>
                  <CardDescription>Enter the details for each passenger.</CardDescription>
                </CardHeader>
                <CardContent>
                  {fields.map((field, index) => (
                    <div key={field.id} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-4 items-center mb-4">
                      <FormField
                        control={form.control}
                        name={`passengers.${index}.firstName`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name</FormLabel>
                            <FormControl>
                              <Input placeholder="John" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`passengers.${index}.lastName`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Doe" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        onClick={() => remove(index)}
                        className="mt-6"
                        disabled={fields.length === 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button type="button" variant="outline" onClick={() => append({ firstName: '', lastName: '' })}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Passenger
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                  <CardDescription>We'll send your booking confirmation here.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center"><Mail className="mr-2 h-4 w-4"/> Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="you@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center"><Phone className="mr-2 h-4 w-4"/> Phone Number</FormLabel>
                        <FormControl>
                          <Input type="tel" placeholder="+1 234 567 890" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
              
              <div className="flex justify-end">
                <Button type="submit" size="lg">
                  Continue Booking <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </form>
          </Form>
        </div>
        <div className="md:col-span-1">
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle>Booking Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-lg">
                  {type === 'hotel' ? <FormatBoldText text={(item as HotelOption).name} /> : `${(item as TravelOption).mode}: ${(item as TravelOption).details}`}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {type === 'hotel' ? `Price: ${(item as HotelOption).pricePerNight}` : `Cost: ${(item as TravelOption).cost}, Duration: ${(item as TravelOption).duration}`}
                </p>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-xl">
                <span>Total</span>
                <span>{type === 'hotel' ? (item as HotelOption).pricePerNight : (item as TravelOption).cost}</span>
              </div>
              <p className="text-xs text-muted-foreground text-center">Taxes and fees may apply.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
    <AuthModal />
  </>
  );
}
