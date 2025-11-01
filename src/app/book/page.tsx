
// src/app/book/page.tsx
'use client';

import { useBooking, type InsuranceDetails, type SeatDetails } from '@/context/booking-context';
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
import { PlusCircle, Trash2, User, Mail, Phone, ArrowRight, ShieldCheck, Tag, Baby, PersonStanding, Building, IndianRupee, CaseUpper, ShieldQuestion, ArrowLeft } from 'lucide-react';
import { AuthModal } from '@/components/auth-modal';
import type { GetTravelOptionsOutput } from '@/ai/flows/get-travel-options';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { handleBookingRequest, handlePaymentRequest } from '@/app/actions';
import { formatCurrency } from '@/lib/formatters';
import { useTrip } from '@/context/trip-context';

type TravelOption = GetTravelOptionsOutput['travelOptions'][0];
type HotelOption = GetTravelOptionsOutput['hotelOptions'][0];

const passengerSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  gender: z.string().min(1, "Gender is required"),
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
  contactPhone: z.string().length(10, 'Contact number must be 10 digits'),
  agreeToTerms: z.boolean().refine(val => val === true, { message: "You must agree to the terms and conditions." }),
  useGST: z.boolean().default(false),
  insurance: z.enum(['yes', 'no']).default('no'),
  gstDetails: gstDetailsSchema.optional(),
}).refine(data => {
    if (data.useGST && !data.gstDetails) {
      return false;
    }
    return true;
}, {
    message: "GST Details are required when Use GST is checked.",
    path: ["gstDetails"],
});

const DUMMY_COUPONS: { [key: string]: { type: 'fixed' | 'percentage', value: number, description: string } } = {
    "WANDER10": { type: 'percentage', value: 10, description: "Get 10% off your booking." },
    "FLYHIGH": { type: 'fixed', value: 500, description: "Get flat ₹500 off." },
    "TRAVELNOW": { type: 'fixed', value: 1200, description: "Get flat ₹1200 off." },
};

const HOTEL_INSURANCE_COST = 1;
const TRAVEL_INSURANCE_COSTS = {
    'Flight': 49,
    'Train': 2.5,
    'Bus': 9,
};
const PLATFORM_FEES = {
    'travel': 39,
    'hotel': 49,
};

export default function BookPage() {
  const router = useRouter();
  const { bookingOption, addBookingAndSaveTrip, setPendingBooking, getBookingsForTrip } = useBooking();
  const { currentTrip } = useTrip();
  const { isAuthenticated, user, openAuthModal } = useAuth();
  const { toast } = useToast();

  const [isProcessing, setIsProcessing] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(0);

  const isHotelBooking = bookingOption?.type === 'hotel';

  const insuranceCostPerPerson = useMemo(() => {
    if (!bookingOption) return 0;
    if (isHotelBooking) return HOTEL_INSURANCE_COST;
    
    const travelMode = (bookingOption.item as TravelOption).mode as keyof typeof TRAVEL_INSURANCE_COSTS;
    return TRAVEL_INSURANCE_COSTS[travelMode] || 0;
  }, [bookingOption, isHotelBooking]);

  const platformFee = useMemo(() => {
      if (!bookingOption) return 0;
      return isHotelBooking ? PLATFORM_FEES.hotel : PLATFORM_FEES.travel;
  }, [bookingOption, isHotelBooking]);

  const form = useForm<z.infer<typeof bookingFormSchema>>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      passengers: [{ title: 'Mr', firstName: '', lastName: '', gender: 'male', age: 30 }],
      contactEmail: '',
      contactPhone: '',
      agreeToTerms: false,
      useGST: false,
      insurance: 'no',
    },
  });
  
  // This effect pre-fills the form with the latest booking details for the current trip
  useEffect(() => {
    if (currentTrip) {
      // Find the latest booking for this trip
      const tripBookings = getBookingsForTrip(currentTrip.id)
        .sort((a, b) => new Date(b.bookingDate).getTime() - new Date(a.bookingDate).getTime());

      if (tripBookings.length > 0) {
        const latestBooking = tripBookings[0];
        form.reset({
          ...form.getValues(), // keep other defaults
          passengers: latestBooking.passengerDetails.passengers,
          contactEmail: latestBooking.passengerDetails.email,
          contactPhone: latestBooking.passengerDetails.phone,
        });
         toast({
          title: "Passenger Details Pre-filled",
          description: "We've filled in your details from your last booking on this trip.",
        });
      }
    } else if (isAuthenticated && user) {
        // Fallback for logged-in user with no previous bookings on this trip
        form.setValue('contactEmail', user.email || '');
        form.setValue('contactPhone', user.contact || '');
    }
  }, [currentTrip, getBookingsForTrip, isAuthenticated, user, form, toast]);


  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'passengers',
  });
  
  const watchedPassengers = form.watch('passengers');
  const useGST = form.watch('useGST');
  const wantsInsurance = form.watch('insurance') === 'yes';

  const priceSummary = useMemo(() => {
    const summary = {
        adults: { count: 0 },
        children: { count: 0 },
        infants: { count: 0 },
        baseFare: 0,
        gst: 0,
        platformFee: platformFee,
        insurance: 0,
        subTotal: 0,
        discount: appliedDiscount,
        grandTotal: 0,
    };

    if (!bookingOption) return summary;

    if (bookingOption.type === 'hotel') {
        const hotelItem = bookingOption.item as HotelOption;
        summary.baseFare = hotelItem.pricePerNight * watchedPassengers.length; 
        summary.adults.count = watchedPassengers.length;
    } else { // Travel option
        const baseCost = (bookingOption.item as TravelOption).cost;
        watchedPassengers.forEach(passenger => {
            let passengerCost = 0;
            if (passenger.age >= 11) {
                summary.adults.count++;
                passengerCost = baseCost;
            } else if (passenger.age >= 2) {
                summary.children.count++;
                passengerCost = baseCost * 0.5; // 50% fare for children
            } else {
                summary.infants.count++;
                passengerCost = baseCost * 0.1; // 10% fare for infants
            }
            summary.baseFare += passengerCost;
        });
    }
    
    summary.gst = summary.baseFare * 0.18;
    
    if (wantsInsurance) {
        summary.insurance = insuranceCostPerPerson * watchedPassengers.length;
    }

    summary.subTotal = summary.baseFare + summary.gst + summary.platformFee + summary.insurance;
    summary.grandTotal = summary.subTotal - summary.discount;

    return summary;
}, [watchedPassengers, appliedDiscount, bookingOption, wantsInsurance, insuranceCostPerPerson, platformFee]);
  

  useEffect(() => {
    if (!bookingOption) {
        router.push('/');
    }
  }, [bookingOption, router]);

  const onFormSubmit = async (data: z.infer<typeof bookingFormSchema>) => {
    if (!isAuthenticated) {
        setPendingBooking({
             ...(bookingOption!),
            passengerDetails: {
                passengers: data.passengers,
                email: data.contactEmail,
                phone: data.contactPhone
            },
            bookingDate: new Date().toISOString(),
            id: `pending_${Date.now()}`
        });
        openAuthModal('signup');
        return;
    }
    
    await processBooking(data);
  }

  const processBooking = async (data: z.infer<typeof bookingFormSchema>) => {
     if (!bookingOption) {
        toast({ title: "Error", description: "No booking option selected.", variant: "destructive" });
        return;
     }

    if (!currentTrip) {
        toast({
            title: "Trip Not Found",
            description: "Cannot complete booking without an active trip.",
            variant: "destructive",
        });
        return;
    }

    setIsProcessing(true);
    toast({ title: "Processing Booking...", description: "Please wait while we confirm your booking." });

    try {
        const bookingReq = await handleBookingRequest({ item: bookingOption.type, details: bookingOption.type === 'travel' ? (bookingOption.item as TravelOption).details : (bookingOption.item as HotelOption).name });
        
        if (!bookingReq.success) {
            throw new Error("Failed to initiate booking with the provider.");
        }
        
        const paymentReq = await handlePaymentRequest({
            bookingId: bookingReq.bookingId,
            cardholderName: user?.name || "Wander Genie",
            amount: priceSummary.grandTotal
        });

        if (!paymentReq.success) {
             throw new Error("Payment failed. Please try again.");
        }
        
        // Generate dummy seat and insurance details
        let seatDetails: SeatDetails | undefined;
        let insuranceDetails: InsuranceDetails | undefined;

        if (bookingOption.type === 'travel') {
            seatDetails = {
                pnr: `WDR-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
                seats: data.passengers.map((_, i) => `${Math.floor(Math.random() * 30) + 1}${String.fromCharCode(65 + (i % 6))}`)
            };
        }

        if (wantsInsurance) {
            insuranceDetails = {
                policyId: `INS-${Math.random().toString(36).substring(2, 12).toUpperCase()}`,
                provider: isHotelBooking ? 'WanderStay Secure' : 'WanderSecure Insurance',
                coverageAmount: isHotelBooking ? 50000 : 500000,
            };
        }

        const newBooking = {
            ...bookingOption,
            id: bookingReq.bookingId,
            transactionId: paymentReq.transactionId,
            passengerDetails: {
                passengers: data.passengers,
                email: data.contactEmail,
                phone: data.contactPhone
            },
            bookingDate: new Date().toISOString(),
            amountPaid: priceSummary.grandTotal,
            seatDetails,
            insuranceDetails,
        };

        addBookingAndSaveTrip(newBooking, currentTrip);
        router.push(`/payment-confirmation?bookingId=${newBooking.id}`);

    } catch (error) {
        console.error("Booking process failed:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        toast({
            title: "Booking Failed",
            description: errorMessage,
            variant: "destructive",
        });
    } finally {
        setIsProcessing(false);
    }
  };


  const applyCoupon = (code: string) => {
    const coupon = DUMMY_COUPONS[code.toUpperCase()];
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
            description: <p className="flex items-center">You've saved <IndianRupee className="inline-block h-4 w-4 mx-1" />{formatCurrency(discount)} with coupon {code.toUpperCase()}.</p>
        });
    } else {
        setAppliedDiscount(0);
        toast({
            title: "Invalid Coupon",
            description: "The coupon code you entered is not valid.",
            variant: "destructive",
        });
    }
  }

  const handleApplyCouponFromInput = () => {
    applyCoupon(couponCode);
  };


  if (!bookingOption) {
    return <div className="text-center p-8">No booking option selected. Redirecting...</div>;
  }
  
  const { item, type } = bookingOption;

  const renderBookingItemDetails = () => {
    const title = type === 'travel' ? 'Travel Detail' : 'Hotel Detail';
    const details = type === 'travel' 
        ? `${(item as TravelOption).details} | ${(item as TravelOption).duration} | Economy`
        : `${(item as HotelOption).name} | ${(item as HotelOption).rating} Stars`;

    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-between">
                    <div>
                        <p className="font-bold text-lg">{details}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
  }

  return (
    <>
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-slate-50">
      <div className="flex justify-start mb-4">
        <Button variant="outline" onClick={() => router.push('/')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
        </Button>
      </div>
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onFormSubmit)} className="space-y-6">
                    {renderBookingItemDetails()}

                    <Card>
                        <CardHeader className="bg-purple-50 flex items-center gap-4 p-4 rounded-t-lg">
                            {isHotelBooking ? <ShieldQuestion className="h-8 w-8 text-purple-600" /> : <ShieldCheck className="h-8 w-8 text-purple-600" />}
                            <div>
                                <CardTitle className="text-lg">{isHotelBooking ? 'Secure Your Stay' : 'Add travel insurance and secure your trip'}</CardTitle>
                                <FormDescription className="flex items-center">
                                    {isHotelBooking 
                                        ? <>Get free cancellation coverage for your booking for just <IndianRupee className="inline-block h-4 w-4 mx-1" />{formatCurrency(insuranceCostPerPerson)} per person.</>
                                        : <>Get comprehensive travel coverage for your trip for just <IndianRupee className="inline-block h-4 w-4 mx-1" />{formatCurrency(insuranceCostPerPerson)} per person.</>
                                    }
                                </FormDescription>
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
                                                    Yes, I want to secure my {isHotelBooking ? 'booking' : 'trip'} with insurance.
                                                </FormLabel>
                                            </FormItem>
                                            <FormItem className="flex items-center space-x-3 space-y-0">
                                                <FormControl>
                                                    <RadioGroupItem value="no" />
                                                </FormControl>
                                                <FormLabel className="font-normal">
                                                    No, I do not want to insure my {isHotelBooking ? 'booking' : 'trip'}.
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
                                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
                                            name={`passengers.${index}.gender`}
                                            render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Gender</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Gender" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="male">Male</SelectItem>
                                                        <SelectItem value="female">Female</SelectItem>
                                                        <SelectItem value="other">Other</SelectItem>
                                                    </SelectContent>
                                                </Select>
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
                                                <Input type="number" placeholder="30" {...field} 
                                                    onChange={(e) => {
                                                        const age = parseInt(e.target.value, 10);
                                                        field.onChange(age);
                                                        if (age > 10 && form.getValues(`passengers.${index}.title`) === 'Master') {
                                                            form.setValue(`passengers.${index}.title`, 'Mr');
                                                            toast({
                                                                title: "Passenger Updated",
                                                                description: "Passenger older than 10 is considered an adult."
                                                            });
                                                        }
                                                    }}
                                                />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                            )}
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                        <div className="flex gap-2">
                            <Button type="button" variant="outline" onClick={() => append({ title: 'Mr', firstName: '', lastName: '', gender: 'male', age: 30 })}>
                                <PlusCircle className="mr-2 h-4 w-4" /> Add Adult
                            </Button>
                            <Button type="button" variant="outline" onClick={() => append({ title: 'Master', firstName: '', lastName: '', gender: 'male', age: 6 })}>
                                <PlusCircle className="mr-2 h-4 w-4" /> Add Child
                            </Button>
                        </div>
                    
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
                                <div className="flex items-center gap-2">
                                     <Select defaultValue="+91">
                                        <SelectTrigger className="w-[80px]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="+91">+91</SelectItem>
                                            <SelectItem value="+1">+1</SelectItem>
                                            <SelectItem value="+44">+44</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormControl>
                                        <Input type="tel" placeholder="Enter Mobile no" {...field} maxLength={10} />
                                    </FormControl>
                                </div>
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
                         <Button type="submit" size="lg" disabled={isProcessing} className="w-full lg:w-auto bg-accent hover:bg-accent/90 text-accent-foreground">
                            {isProcessing ? (
                                <>
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current mr-2"></div>
                                Processing...
                                </>
                            ) : (
                                <>Pay Securely <ArrowRight className="ml-2 h-4 w-4" /></>
                            )}
                        </Button>
                    </div>
                </form>
            </Form>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle className="flex items-center"><IndianRupee className="mr-2 h-5 w-5" />Price Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                    <span>Base Fare</span>
                     <span className='flex items-center'><IndianRupee className="h-4 w-4 mr-1"/>{formatCurrency(priceSummary.baseFare)}</span>
                </div>
                <div className="flex justify-between">
                    <span>Taxes & Surcharges (18% GST)</span>
                     <span className='flex items-center'><IndianRupee className="h-4 w-4 mr-1"/>{formatCurrency(priceSummary.gst)}</span>
                </div>
                 <div className="flex justify-between">
                    <span>Platform Fee</span>
                     <span className='flex items-center'><IndianRupee className="h-4 w-4 mr-1"/>{formatCurrency(priceSummary.platformFee)}</span>
                </div>
                 {priceSummary.insurance > 0 && (
                     <div className="flex justify-between">
                        <span>{isHotelBooking ? 'Cancellation Insurance' : 'Travel Insurance'}</span>
                        <span className='flex items-center'><IndianRupee className="h-4 w-4 mr-1"/>{formatCurrency(priceSummary.insurance)}</span>
                    </div>
                 )}
                {appliedDiscount > 0 && (
                     <div className="flex justify-between text-green-600">
                        <span>Discount</span>
                        <span className='flex items-center'>-<IndianRupee className="h-4 w-4 mr-1"/>{formatCurrency(appliedDiscount)}</span>
                    </div>
                )}
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                    <span>Grand Total</span>
                    <span className='flex items-center'><IndianRupee className="h-5 w-5 mr-1"/>{formatCurrency(priceSummary.grandTotal)}</span>
                </div>
                <Separator />
               {priceSummary.adults.count > 0 && (
                <div>
                  <div className="flex justify-between items-center text-muted-foreground">
                    <span className="flex items-center"><PersonStanding className="mr-2 h-5 w-5" /> Adult x{priceSummary.adults.count}</span>
                  </div>
                </div>
              )}
              {priceSummary.children.count > 0 && (
                 <div>
                  <div className="flex justify-between items-center text-muted-foreground">
                    <span className="flex items-center"><User className="mr-2 h-5 w-5" /> Child x{priceSummary.children.count}</span>
                  </div>
                </div>
              )}
               {priceSummary.infants.count > 0 && (
                 <div>
                  <div className="flex justify-between items-center text-muted-foreground">
                    <span className="flex items-center"><Baby className="mr-2 h-5 w-5" /> Infant x{priceSummary.infants.count}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
                <CardTitle className="flex items-center"><Tag className="mr-2"/> Offers & Promo Code</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div className="flex items-center space-x-2">
                    <Input 
                        placeholder="Enter Coupon Code" 
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        />
                    <Button variant="outline" onClick={handleApplyCouponFromInput}>Apply</Button>
                </div>
                <Separator />
                <div className="space-y-2">
                    {Object.entries(DUMMY_COUPONS).map(([code, { description }]) => (
                        <div key={code} className="flex justify-between items-center text-sm p-2 bg-secondary/50 rounded-md">
                            <div>
                                <p className="font-semibold">{code}</p>
                                <p className="text-muted-foreground">{description.replace('₹', '')}</p>
                            </div>
                            <Button variant="link" size="sm" onClick={() => applyCoupon(code)}>Apply</Button>
                        </div>
                    ))}
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
