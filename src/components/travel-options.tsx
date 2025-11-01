
"use client";

import type { GetTravelOptionsOutput } from "@/ai/flows/get-travel-options";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { ArrowRight, Plane, Train, Bus, Clock, Wallet, Armchair, Building, Star, BedDouble, IndianRupee, ArrowLeft, Edit, CheckCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import React from "react";
import { FormatBoldText } from "./format-bold-text";
import { BookingModal } from "./booking-modal";
import { formatCurrency } from "@/lib/formatters";
import { useBooking, type Booking } from "@/context/booking-context";
import { useTrip, type Trip } from "@/context/trip-context";
import { useToast } from "@/hooks/use-toast";

const iconMap: { [key: string]: React.ReactElement } = {
    Flight: <Plane className="h-6 w-6 text-primary" />,
    Train: <Train className="h-6 w-6 text-primary" />,
    Bus: <Bus className="h-6 w-6 text-primary" />,
};

type TravelOptionType = GetTravelOptionsOutput['travelOptions'][0];
type HotelOptionType = GetTravelOptionsOutput['hotelOptions'][0];


const TravelModeSection = ({ options, showAll }: { options: TravelOptionType[], showAll: boolean }) => {
    const modes = React.useMemo(() => Array.from(new Set(options.map(o => o.mode))), [options]);

    return (
        <div className="space-y-6">
            {modes.map(mode => {
                const optionsForMode = options.filter(o => o.mode === mode);
                const displayedOptions = showAll ? optionsForMode : optionsForMode.slice(0, 1);
                
                if (optionsForMode.length === 0) return null;

                return (
                    <React.Fragment key={mode}>
                        {displayedOptions.map((option, index) => (
                            <div key={`${mode}-${index}`}>
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="bg-primary/10 p-3 rounded-full">
                                            {iconMap[option.mode] || <Plane className="h-6 w-6 text-primary" />}
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-lg">{option.mode}: <span className="text-primary">{option.details}</span></h4>
                                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground mt-1">
                                                <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> {option.duration}</span>
                                                <span className="flex items-center gap-1.5"><IndianRupee className="h-4 w-4" /> {formatCurrency(option.cost)}</span>
                                                <span className="flex items-center gap-1.5"><Armchair className="h-4 w-4" /> {option.comfort}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <BookingModal
                                        option={option}
                                        optionType="travel"
                                        triggerButton={
                                            <Button className="bg-accent hover:bg-accent/90 text-accent-foreground shrink-0">
                                                Book Now <ArrowRight className="ml-2 h-4 w-4" />
                                            </Button>
                                        }
                                    />
                                </div>
                                {index < displayedOptions.length - 1 && <Separator className="mt-6" />}
                            </div>
                        ))}
                    </React.Fragment>
                );
            })}
        </div>
    )
}

const ConfirmedBookingCard = ({ booking, onModify }: { booking: Booking, onModify: (booking: Booking) => void }) => {
    const { item, type } = booking;
    const { toast } = useToast();

    const handleChangeBooking = () => {
        // In a real app, this would be a complex flow.
        // For now, it just shows a toast message.
        toast({
            title: "Change Booking",
            description: "This feature is not yet implemented. In a real app, this would allow you to modify your booking.",
        });
    };

    return (
        <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="bg-green-100 p-3 rounded-full">
                            <CheckCircle className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                             <h4 className="font-semibold text-lg text-green-800">
                                {type === 'travel' ? 'Departure Booked:' : 'Hotel Booked:'} <span className="text-green-600">{(item as TravelOptionType).details || (item as HotelOptionType).name}</span>
                            </h4>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-green-700/80 mt-1">
                                <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> {type === 'travel' && (item as TravelOptionType).duration}</span>
                                <span className="flex items-center gap-1.5"><IndianRupee className="h-4 w-4" /> {formatCurrency(booking.amountPaid || 0)}</span>
                            </div>
                        </div>
                    </div>
                    <Button variant="outline" onClick={handleChangeBooking} className="border-green-300 text-green-700 hover:bg-green-100 hover:text-green-800 shrink-0">
                        <Edit className="mr-2 h-4 w-4" /> Change
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};


const TravelOptions = ({ 
    onHotelBooked,
    onBackToPlan 
}: { 
    onHotelBooked: (hotelName: string) => void,
    onBackToPlan: () => void
}) => {
    const { currentTrip } = useTrip();
    const { getBookingsForTrip } = useBooking();

    const [showAllTransport, setShowAllTransport] = React.useState(false);
    
    if (!currentTrip) {
        return <p>No trip selected.</p>
    }

    const { outboundTravelOptions, returnTravelOptions } = currentTrip;
    const tripBookings = getBookingsForTrip(currentTrip.id);
    
    const outboundBooking = tripBookings.find(b => {
        if(b.type !== 'travel') return false;
        const travelItem = b.item as TravelOptionType;
        // This is a naive check. A real app would use unique flight/train numbers.
        return outboundTravelOptions?.travelOptions.some(opt => opt.details === travelItem.details);
    });

    const returnBooking = tripBookings.find(b => {
        if(b.type !== 'travel') return false;
        const travelItem = b.item as TravelOptionType;
        return returnTravelOptions?.travelOptions.some(opt => opt.details === travelItem.details);
    });
    
    const hotelBooking = tripBookings.find(b => b.type === 'hotel');

    const hasMultipleOptions = React.useMemo(() => {
        if (!outboundTravelOptions) return false;
        const outBoundModes = new Set(outboundTravelOptions.travelOptions.map(o => o.mode));
        return outboundTravelOptions.travelOptions.length > outBoundModes.size;
    }, [outboundTravelOptions]);

    return (
        <Card className="shadow-lg bg-card">
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="text-3xl">Travel & Booking</CardTitle>
                    <CardDescription>Confirm your travel and accommodation for your trip.</CardDescription>
                </div>
                 <Button variant="outline" onClick={onBackToPlan}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Trip Plan
                </Button>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="transport" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="transport">
                            <Plane className="mr-2 h-4 w-4" /> Transportation
                        </TabsTrigger>
                        <TabsTrigger value="hotels">
                            <Building className="mr-2 h-4 w-4" /> Hotels
                        </TabsTrigger>
                    </TabsList>
                    <TabsContent value="transport" className="mt-6">
                        <div className="space-y-8">
                            <div>
                                <h3 className="text-xl font-bold mb-4">Departure Options</h3>
                                {outboundBooking ? (
                                    <ConfirmedBookingCard booking={outboundBooking} onModify={() => {}} />
                                ) : outboundTravelOptions ? (
                                    <TravelModeSection options={outboundTravelOptions.travelOptions} showAll={showAllTransport} />
                                ) : (
                                    <p>No departure options available.</p>
                                )}
                            </div>

                            {currentTrip.returnDate && (
                                <div>
                                    <Separator className="my-8" />
                                    <h3 className="text-xl font-bold mb-4">Return Options</h3>
                                    {returnBooking ? (
                                        <ConfirmedBookingCard booking={returnBooking} onModify={() => {}} />
                                    ) : returnTravelOptions ? (
                                        <TravelModeSection options={returnTravelOptions.travelOptions} showAll={showAllTransport} />
                                    ) : (
                                        <p>No return options available for this trip.</p>
                                    )}
                                </div>
                            )}

                             {hasMultipleOptions && (!outboundBooking || (currentTrip.returnDate && !returnBooking)) && (
                                <div className="text-center pt-4">
                                    <Button variant="outline" onClick={() => setShowAllTransport(prev => !prev)}>
                                        {showAllTransport ? "Show Fewer Options" : "Show All Options"}
                                    </Button>
                                </div>
                            )}
                        </div>
                    </TabsContent>
                    <TabsContent value="hotels" className="mt-6">
                         <div className="space-y-6">
                            {hotelBooking ? (
                                <ConfirmedBookingCard booking={hotelBooking} onModify={() => {}} />
                            ) : (
                                <>
                                {outboundTravelOptions?.hotelOptions.map((option, index) => (
                                    <div key={index}>
                                        <div className="flex items-center justify-between gap-4">
                                            <div className="flex items-center gap-4">
                                                <div className="bg-primary/10 p-3 rounded-full">
                                                    <BedDouble className="h-6 w-6 text-primary" />
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold text-lg text-primary">
                                                        <FormatBoldText text={option.name} />
                                                    </h4>
                                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground mt-1">
                                                        <div className="flex items-center gap-1">
                                                            {Array.from({ length: 5 }).map((_, i) => (
                                                                <Star key={i} className={`h-4 w-4 ${i < option.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                                                            ))}
                                                        </div>
                                                        <span className="flex items-center gap-1.5"><IndianRupee className="h-4 w-4" /> {formatCurrency(option.pricePerNight)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <BookingModal
                                                option={option}
                                                optionType="hotel"
                                                onBookingComplete={onHotelBooked}
                                                triggerButton={
                                                    <Button className="bg-accent hover:bg-accent/90 text-accent-foreground shrink-0">
                                                        Book Now <ArrowRight className="ml-2 h-4 w-4" />
                                                    </Button>
                                                }
                                            />
                                        </div>
                                        {index < outboundTravelOptions.hotelOptions.length - 1 && <Separator className="mt-6" />}
                                    </div>
                                ))}
                                </>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    )
}

export default TravelOptions;
