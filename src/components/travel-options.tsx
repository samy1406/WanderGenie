
"use client";

import type { GetTravelOptionsOutput } from "@/ai/flows/get-travel-options";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { ArrowRight, Plane, Train, Bus, Clock, Wallet, Armchair, Building, Star, BedDouble } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import React, from "react";
import { FormatBoldText } from "./format-bold-text";
import { BookingModal } from "./booking-modal";
import { formatCurrency } from "@/lib/formatters";

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
                                                <span className="flex items-center gap-1.5"><Wallet className="h-4 w-4" /> ₹{option.cost}</span>
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

const TravelOptions = ({ 
    outboundTravelOptions, 
    returnTravelOptions, 
    hotelOptions, 
    onHotelBooked 
}: { 
    outboundTravelOptions: GetTravelOptionsOutput, 
    returnTravelOptions: GetTravelOptionsOutput | null, 
    hotelOptions: GetTravelOptionsOutput['hotelOptions'],
    onHotelBooked: (hotelName: string) => void
}) => {
    const [showAllTransport, setShowAllTransport] = React.useState(false);
    const hasMultipleOptions = React.useMemo(() => {
        const outBoundModes = new Set(outboundTravelOptions.travelOptions.map(o => o.mode));
        return outboundTravelOptions.travelOptions.length > outBoundModes.size;
    }, [outboundTravelOptions]);

    return (
        <Card className="shadow-lg bg-card">
            <CardHeader>
                <CardTitle className="text-3xl">Travel & Booking</CardTitle>
                <CardDescription>Here are some options to get you to your destination and back.</CardDescription>
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
                                <TravelModeSection options={outboundTravelOptions.travelOptions} showAll={showAllTransport} />
                            </div>

                            {returnTravelOptions && (
                                <div>
                                    <Separator className="my-8" />
                                    <h3 className="text-xl font-bold mb-4">Return Options</h3>
                                    <TravelModeSection options={returnTravelOptions.travelOptions} showAll={showAllTransport} />
                                </div>
                            )}

                             {hasMultipleOptions && (
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
                             {hotelOptions.map((option, index) => (
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
                                                    <span className="flex items-center gap-1.5"><Wallet className="h-4 w-4" /> ₹{option.pricePerNight}</span>
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
                                    {index < hotelOptions.length - 1 && <Separator className="mt-6" />}
                                </div>
                            ))}
                        </div>
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    )
}

export default TravelOptions;
