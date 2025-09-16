"use client";

import type { GetTravelOptionsOutput } from "@/ai/flows/get-travel-options";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { ArrowRight, Ticket, Clock, Wallet, Armchair } from "lucide-react";

const iconMap = {
    Flight: <Ticket className="h-5 w-5 text-primary" />,
    Train: <Ticket className="h-5 w-5 text-primary" />,
    Bus: <Ticket className="h-5 w-5 text-primary" />,
};

const TravelOptions = ({ travelOptionsData }: { travelOptionsData: GetTravelOptionsOutput }) => {
    return (
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="font-headline text-3xl">Travel & Booking</CardTitle>
                <CardDescription>Here are some options to get you to your destination.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    {travelOptionsData.travelOptions.map((option, index) => (
                        <div key={index}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    {iconMap[option.mode as keyof typeof iconMap] || <Ticket className="h-5 w-5 text-primary" />}
                                    <div>
                                        <h4 className="font-semibold">{option.mode}: <span className="text-primary">{option.details}</span></h4>
                                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                                            <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {option.duration}</span>
                                            <span className="flex items-center gap-1"><Wallet className="h-4 w-4" /> {option.cost}</span>
                                            <span className="flex items-center gap-1"><Armchair className="h-4 w-4" /> {option.comfort}</span>
                                        </div>
                                    </div>
                                </div>
                                <Button asChild variant="outline">
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
