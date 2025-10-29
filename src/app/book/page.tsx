
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
import { PlusCircle, Trash2, User, Mail, Phone, ArrowRight, ShieldCheck, Tag, Info, Square, CheckSquare, Briefcase } from 'lucide-react';
import { AuthModal } from '@/components/auth-modal';
import type { GetTravelOptionsOutput } from '@/ai/flows/get-travel-options';
import { FormatBoldText } from '@/components/format-bold-text';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type TravelOption = GetTravelOptionsOutput['travelOptions'][0];
type HotelOption = GetTravelOptionsOutput['hotelOptions'][0];

const passengerSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email').optional(),
  contactNumber: z.string().optional(),
});

const bookingFormSchema = z.object({
  passengers: z.array(passengerSchema).min(1, 'At least one passenger is required'),
  contactEmail: z.string().email('A valid contact email is required'),
  contactPhone: z.string().min(10, 'A valid contact phone number is required'),
  agreeToTerms: z.boolean().refine(val => val === true, { message: "You must agree to the terms and conditions." }),
  useGST: z.boolean().default(false),
  insurance: z.enum(['yes', 'no']).default('no'),
});

export default function BookPage() {
  const router = useRouter();
  const { bookingOption, addBooking, setPendingBooking } = useBooking();
  const { isAuthenticated, user, openAuthModal } = useAuth();

  const form = useForm<z.infer<typeof bookingFormSchema>>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      passengers: [{ title: 'Mr', firstName: '', lastName: '' }],
      contactEmail: '',
      contactPhone: '',
      agreeToTerms: false,
      useGST: false,
      insurance: 'no',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'passengers',
  });
  
  useEffect(() => {
    if (isAuthenticated && user) {
      form.setValue('contactEmail', user.email);
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
      passengerDetails: {
        passengers: data.passengers,
        email: data.contactEmail,
        phone: data.contactPhone
      },
      bookingDate: new Date().toISOString(),
      id: `booking_${Date.now()}`
    };

    if (isAuthenticated) {
      addBooking(newBooking);
      router.push('/my-bookings');
    } else {
      setPendingBooking(newBooking);
      openAuthModal('signup');
    }
  };

  const { item, type } = bookingOption;

  const renderFlightDetails = () => {
    if (type !== 'travel' || (item as TravelOption).mode !== 'Flight') return null;
    const travelItem = item as TravelOption;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Flight Detail</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-between">
                    <div>
                        <p className="font-bold text-lg">{travelItem.details}</p>
                        <p className="text-sm text-muted-foreground">{travelItem.duration} | 2+ stops | Economy</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
  }

  return (
    <>
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-slate-50">
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
            {renderFlightDetails()}

            <Card>
                <CardHeader className="bg-purple-50 flex items-center gap-4 p-4 rounded-t-lg">
                    <ShieldCheck className="h-8 w-8 text-purple-600" />
                    <div>
                        <CardTitle className="text-lg">Add travel insurance and secure your trip</CardTitle>
                        <CardDescription>Get comprehensive travel coverage for your trip.</CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="p-6">
                    <FormField
                        control={form.control}
                        name="insurance"
                        render={({ field }) => (
                            <FormItem>
                                <RadioGroup
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                    className="space-y-2"
                                >
                                    <FormItem className="flex items-center space-x-3 space-y-0">
                                        <FormControl>
                                            <RadioGroupItem value="yes" />
                                        </FormControl>
                                        <FormLabel className="font-normal">
                                            Yes, I want to secure my trip with insurance.
                                        </FormLabel>
                                    </FormItem>
                                    <FormItem className="flex items-center space-x-3 space-y-0">
                                        <FormControl>
                                            <RadioGroupItem value="no" />
                                        </FormControl>
                                        <FormLabel className="font-normal">
                                            No, I do not want to insure my trip.
                                        </FormLabel>
                                    </FormItem>
                                </RadioGroup>
                            </FormItem>
                        )}
                    />
                </CardContent>
            </Card>

          <h2 className="text-2xl font-bold">Travellers Details</h2>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {fields.map((field, index) => (
                    <Card key={field.id}>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="flex items-center"><User className="mr-2"/> Adult {index + 1}</CardTitle>
                             <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={() => remove(index)}
                                disabled={fields.length === 1}
                                >
                                <Trash2 className="h-4 w-4 mr-2" /> Remove
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <FormField
                                    control={form.control}
                                    name={`passengers.${index}.title`}
                                    render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Title</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Title" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="Mr">Mr</SelectItem>
                                                <SelectItem value="Mrs">Mrs</SelectItem>
                                                <SelectItem value="Ms">Ms</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                    )}
                                />
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
                            </div>
                        </CardContent>
                    </Card>
                ))}
                <Button type="button" variant="outline" onClick={() => append({ title: 'Mr', firstName: '', lastName: '' })}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Adult
                </Button>
              

              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                  <CardDescription>Your ticket & flight details will be shared here.</CardDescription>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="contactEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center"><Mail className="mr-2 h-4 w-4"/> Email Address</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="you@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="contactPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center"><Phone className="mr-2 h-4 w-4"/> Mobile no</FormLabel>
                        <FormControl>
                          <Input type="tel" placeholder="+91 Enter Mobile no" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

               <Card>
                    <CardContent className="pt-6 space-y-4">
                        <FormField
                            control={form.control}
                            name="agreeToTerms"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md">
                                    <FormControl>
                                        <Checkbox
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                        <FormLabel>
                                           I understand and agree to the rules, Privacy Policy, User Agreement and Terms & Conditions of WanderGenie.
                                        </FormLabel>
                                        <FormMessage />
                                    </div>
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="useGST"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md">
                                    <FormControl>
                                        <Checkbox
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                        <FormLabel>
                                            Use GST for this booking (Optional)
                                        </FormLabel>
                                    </div>
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>
              
              <div className="flex justify-end">
                <Button type="submit" size="lg" className="w-full lg:w-auto bg-accent hover:bg-accent/90 text-accent-foreground">
                  Continue Booking <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </form>
          </Form>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle>Price Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Adult x{fields.length}</span>
                <span className="font-semibold">₹{6833 * fields.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Total Taxes</span>
                <span className="font-semibold">₹{1355 * fields.length}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-xl">
                <span>Grand Total</span>
                <span>₹{(6833 + 1355) * fields.length}</span>
              </div>
              <p className="text-xs text-muted-foreground text-center">Taxes and fees may apply.</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
                <CardTitle className="flex items-center"><Tag className="mr-2"/> Offers & Promo Code</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex items-center space-x-2">
                    <Input placeholder="Enter Coupon Code" />
                    <Button variant="outline">Apply</Button>
                </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
    <AuthModal />
  </>
  );
}

    