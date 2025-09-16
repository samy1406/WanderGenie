"use client";

import type { GetTravelOptionsOutput } from "@/ai/flows/get-travel-options";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { ArrowRight, Plane, Train, Bus, Clock, Wallet, Armchair } from "lucide-react";

const iconMap: { [key: string]: React.ReactElement } = {
    Flight: <Plane className="h-6 w-6 text-primary" />,
    Train: <Train className="h-6 w-6 text-primary" />,
    Bus: <Bus className="h-6 w-6 text-primary" />,
};

const TravelOptions = ({ travelOptionsData }: { travelOptionsData: GetTravelOptionsOutput }) => {
    return (
        <Card className="shadow-lg bg-card">
            <CardHeader>
                <CardTitle className="text-3xl">Travel & Booking</CardTitle>
                <CardDescription>Here are some options to get you to your destination.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    {travelOptionsData.travelOptions.map((option, index) => (
                        <div key={index}>
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="bg-primary/10 p-3 rounded-full">
                                      {iconMap[option.mode] || <Plane className="h-6 w-6 text-primary" />}
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-lg">{option.mode}: <span className="text-primary">{option.details}</span></h4>
                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground mt-1">
                                            <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> {option.duration}</span>
                                            <span className="flex items-center gap-1.5"><Wallet className="h-4 w-4" /> {option.cost}</span>
                                            <span className="flex items-center gap-1.5"><Armchair className="h-4 w-4" /> {option.comfort}</span>
                                        </div>
                                    </div>
                                </div>
                                <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground shrink-0">
                                    <a href={option.bookingLink} target="_blank" rel="noopener noreferrer">
                                        Book Now <ArrowRight className="ml-2 h-4 w-4" />
                                    </a>
                                </Button>
                            </div>
                            {index < travelOptionsData.travelOptions.length - 1 && <Separator className="mt-6" />}
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}

export default TravelOptions;
