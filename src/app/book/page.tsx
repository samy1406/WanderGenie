
// src/app/book/page.tsx
'use client';

import { useBooking } from '@/context/booking-context';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { PlusCircle, Trash2, User, Mail, Phone, ArrowRight, ShieldCheck, Tag, Baby, PersonStanding, Building } from 'lucide-react';
import { AuthModal } from '@/components/auth-modal';
import type { GetTravelOptionsOutput } from '@/ai/flows/get-travel-options';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

type TravelOption = GetTravelOptionsOutput['travelOptions'][0];

const passengerSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  age: z.coerce.number().min(0, "Age is required").max(120, "Enter a valid age"),
  email: z.string().email('Invalid email').optional(),
  contactNumber: z.string().optional(),
});

const gstDetailsSchema = z.object({
    companyName: z.string().min(1, "Company name is required"),
    gstNumber: z.string().length(15, "GST number must be 15 characters"),
    companyEmail: z.string().email("Invalid email for company"),
    companyContact: z.string().min(10, "Invalid contact for company"),
});

const bookingFormSchema = z.object({
  passengers: z.array(passengerSchema).min(1, 'At least one passenger is required'),
  contactEmail: z.string().email('A valid contact email is required'),
  contactPhone: z.string().min(10, 'A valid contact phone number is required'),
  agreeToTerms: z.boolean().refine(val => val === true, { message: "You must agree to the terms and conditions." }),
  useGST: z.boolean().default(false),
  gstDetails: gstDetailsSchema.optional(),
  insurance: z.enum(['yes', 'no']).default('no'),
}).refine(data => {
    if (data.useGST && !data.gstDetails) {
      return false;
    }
    return true;
}, {
    message: "GST Details are required when Use GST is checked.",
    path: ["gstDetails"],
});

// Pricing constants based on Indian standards
const PRICES = {
    ADULT: { base: 6833, taxes: 1355 },
    CHILD: { base: 5100, taxes: 1100 },
    INFANT: { base: 1500, taxes: 500 },
};

const DUMMY_COUPONS: { [key: string]: { type: 'fixed' | 'percentage', value: number } } = {
    "WANDER10": { type: 'percentage', value: 10 },
    "FLYHIGH": { type: 'fixed', value: 500 },
    "TRAVELNOW": { type: 'fixed', value: 1200 },
};

export default function BookPage() {
  const router = useRouter();
  const { bookingOption, addBooking, setPendingBooking } = useBooking();
  const { isAuthenticated, user, openAuthModal } = useAuth();
  const { toast } = useToast();

  const [couponCode, setCouponCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  
  const form = useForm<z.infer<typeof bookingFormSchema>>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      passengers: [{ title: 'Mr', firstName: '', lastName: '', age: 30 }],
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
  
  const watchedPassengers = form.watch('passengers');
  const useGST = form.watch('useGST');

  const priceSummary = useMemo(() => {
    const summary = {
      adults: { count: 0, total: 0, base: 0, taxes: 0 },
      children: { count: 0, total: 0, base: 0, taxes: 0 },
      infants: { count: 0, total: 0, base: 0, taxes: 0 },
      baseFare: 0,
      totalTaxes: 0,
      subTotal: 0,
      discount: appliedDiscount,
      grandTotal: 0,
    };

    watchedPassengers.forEach(passenger => {
        if (passenger.age >= 12) {
            summary.adults.count++;
            summary.adults.base += PRICES.ADULT.base;
            summary.adults.taxes += PRICES.ADULT.taxes;
        } else if (passenger.age >= 2) {
            summary.children.count++;
            summary.children.base += PRICES.CHILD.base;
            summary.children.taxes += PRICES.CHILD.taxes;
        } else {
            summary.infants.count++;
            summary.infants.base += PRICES.INFANT.base;
            summary.infants.taxes += PRICES.INFANT.taxes;
        }
    });

    summary.adults.total = summary.adults.base + summary.adults.taxes;
    summary.children.total = summary.children.base + summary.children.taxes;
    summary.infants.total = summary.infants.base + summary.infants.taxes;
    
    summary.baseFare = summary.adults.base + summary.children.base + summary.infants.base;
    summary.totalTaxes = summary.adults.taxes + summary.children.taxes + summary.infants.taxes;
    summary.subTotal = summary.baseFare + summary.totalTaxes;
    summary.grandTotal = summary.subTotal - summary.discount;

    return summary;
  }, [watchedPassengers, appliedDiscount]);
  
  useEffect(() => {
    if (isAuthenticated && user) {
      form.setValue('contactEmail', user.email || '');
    }
  }, [isAuthenticated, user, form]);

  useEffect(() => {
    if (!bookingOption) {
        router.push('/');
    }
  }, [bookingOption, router]);

  if (!bookingOption) {
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

  const handleApplyCoupon = () => {
    const coupon = DUMMY_COUPONS[couponCode.toUpperCase()];
    if(coupon) {
        let discount = 0;
        if(coupon.type === 'fixed') {
            discount = coupon.value;
        } else { // percentage
            discount = (priceSummary.subTotal * coupon.value) / 100;
        }
        setAppliedDiscount(discount);
        toast({
            title: "Coupon Applied!",
            description: <>You've saved &#8377;{discount.toFixed(2)} with coupon {couponCode.toUpperCase()}.</>
        });
    } else {
        setAppliedDiscount(0);
        toast({
            title: "Invalid Coupon",
            description: "The coupon code you entered is not valid.",
            variant: "destructive",
        });
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
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {renderFlightDetails()}

                    <Card>
                        <CardHeader className="bg-purple-50 flex items-center gap-4 p-4 rounded-t-lg">
                            <ShieldCheck className="h-8 w-8 text-purple-600" />
                            <div>
                                <CardTitle className="text-lg">Add travel insurance and secure your trip</CardTitle>
                                <FormDescription>Get comprehensive travel coverage for your trip.</FormDescription>
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
                
                        {fields.map((field, index) => (
                            <Card key={field.id}>
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <CardTitle className="flex items-center"><User className="mr-2"/> Passenger {index + 1}</CardTitle>
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
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                                        <FormField
                                            control={form.control}
                                            name={`passengers.${index}.age`}
                                            render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Age</FormLabel>
                                                <FormControl>
                                                <Input type="number" placeholder="30" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                            )}
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                        <Button type="button" variant="outline" onClick={() => append({ title: 'Mr', firstName: '', lastName: '', age: 30 })}>
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
                                name="useGST"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                        <div className="space-y-0.5">
                                            <FormLabel className="text-base flex items-center"><Building className="mr-2 h-4 w-4"/> Use GST for this booking</FormLabel>
                                            <FormDescription>Select this to claim tax credit on your business travel.</FormDescription>
                                        </div>
                                        <FormControl>
                                            <Checkbox
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />

                           {useGST && (
                                <div className="p-4 border-t space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="gstDetails.companyName"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Company Name</FormLabel>
                                                    <FormControl><Input placeholder="Wander Inc." {...field} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="gstDetails.gstNumber"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>GST Number</FormLabel>
                                                    <FormControl><Input placeholder="15-character GSTIN" {...field} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                         <FormField
                                            control={form.control}
                                            name="gstDetails.companyEmail"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Company Email</FormLabel>
                                                    <FormControl><Input type="email" placeholder="billing@company.com" {...field} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                         <FormField
                                            control={form.control}
                                            name="gstDetails.companyContact"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Company Contact</FormLabel>
                                                    <FormControl><Input type="tel" placeholder="022-12345678" {...field} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>
                            )}

                            <Separator />

                            <FormField
                                control={form.control}
                                name="agreeToTerms"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md pt-4">
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
            <CardContent className="space-y-4 text-sm">
                <div className="flex justify-between">
                    <span>Base Fare</span>
                    <span>&#8377;{priceSummary.baseFare.toLocaleString('en-IN')}</span>
                </div>
                 <div className="flex justify-between">
                    <span>Taxes & Surcharges</span>
                    <span>&#8377;{priceSummary.totalTaxes.toLocaleString('en-IN')}</span>
                </div>
                {appliedDiscount > 0 && (
                     <div className="flex justify-between text-green-600">
                        <span>Discount</span>
                        <span>- &#8377;{appliedDiscount.toLocaleString('en-IN')}</span>
                    </div>
                )}
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                    <span>Grand Total</span>
                    <span>&#8377;{priceSummary.grandTotal.toLocaleString('en-IN')}</span>
                </div>
                <Separator />
               {priceSummary.adults.count > 0 && (
                <div>
                  <div className="flex justify-between items-center text-muted-foreground">
                    <span className="flex items-center"><PersonStanding className="mr-2 h-5 w-5" /> Adult x{priceSummary.adults.count}</span>
                    <span>&#8377;{priceSummary.adults.total.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              )}
              {priceSummary.children.count > 0 && (
                 <div>
                  <div className="flex justify-between items-center text-muted-foreground">
                    <span className="flex items-center"><User className="mr-2 h-5 w-5" /> Child x{priceSummary.children.count}</span>
                    <span>&#8377;{priceSummary.children.total.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              )}
               {priceSummary.infants.count > 0 && (
                 <div>
                  <div className="flex justify-between items-center text-muted-foreground">
                    <span className="flex items-center"><Baby className="mr-2 h-5 w-5" /> Infant x{priceSummary.infants.count}</span>
                    <span>&#8377;{priceSummary.infants.total.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
                <CardTitle className="flex items-center"><Tag className="mr-2"/> Offers & Promo Code</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex items-center space-x-2">
                    <Input 
                        placeholder="Enter Coupon Code" 
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        />
                    <Button variant="outline" onClick={handleApplyCoupon}>Apply</Button>
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
    

    
