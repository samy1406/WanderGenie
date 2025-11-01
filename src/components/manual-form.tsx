
"use client";

import type { UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Users, CalendarIcon, ArrowRight, Clock, SlidersHorizontal, X } from "lucide-react";
import { type formSchema } from "./itinerary-form";
import { Card, CardContent } from "./ui/card";
import { Textarea } from "./ui/textarea";
import type { TripType } from "./trip-planner";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Calendar } from "./ui/calendar";
import { cn } from "@/lib/utils";
import { format, addDays, differenceInCalendarDays } from "date-fns";
import { Badge } from "./ui/badge";
import React from "react";


type ManualFormProps = {
  isLoading: boolean;
  form: UseFormReturn<z.infer<typeof formSchema>>;
  tripType: TripType;
  setTripType: (tripType: TripType) => void;
};


const FilterBadge = ({
  label,
  value,
  onRemove,
}: {
  label: string;
  value: string | number;
  onRemove: () => void;
}) => (
  <Badge
    variant="default"
    className="flex items-center gap-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20"
  >
    <span className="font-normal">{label}:</span>
    <span className="font-semibold">{value}</span>
    <button
      type="button"
      onClick={onRemove}
      className="rounded-full hover:bg-primary/20 p-0.5 -mr-1"
    >
      <X className="h-3 w-3" />
    </button>
  </Badge>
);

export function ManualForm({ isLoading, form, tripType, setTripType }: ManualFormProps) {
    const watchAllFields = form.watch();

    const activeFilters = React.useMemo(() => {
        const filters = [];
        if (watchAllFields.departureTime && watchAllFields.departureTime !== 'any') {
            filters.push({ 
                id: 'departureTime',
                label: 'Departs', 
                value: watchAllFields.departureTime.charAt(0).toUpperCase() + watchAllFields.departureTime.slice(1), 
                onRemove: () => form.setValue('departureTime', 'any') 
            });
        }
        if (watchAllFields.arrivalTime && watchAllFields.arrivalTime !== 'any') {
            filters.push({ 
                id: 'arrivalTime',
                label: 'Arrives', 
                value: watchAllFields.arrivalTime.charAt(0).toUpperCase() + watchAllFields.arrivalTime.slice(1), 
                onRemove: () => form.setValue('arrivalTime', 'any') 
            });
        }
        return filters;
    }, [watchAllFields.departureTime, watchAllFields.arrivalTime, form]);


    return (
      <Card className="w-full shadow-lg border-none">
        <CardContent className="p-0">
          <div className="grid grid-cols-1 lg:grid-cols-[2fr_2fr_1.5fr_1.5fr_1.5fr_auto] items-stretch border rounded-lg">
              {/* From */}
              <FormField
              control={form.control}
              name="origin"
              render={({ field }) => (
                  <FormItem className="p-4 relative flex flex-col justify-center">
                  <FormLabel className="text-xs text-gray-500">FROM</FormLabel>
                  <FormControl>
                      <Input placeholder="Delhi" {...field} className="text-2xl font-bold border-0 p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0" />
                  </FormControl>
                  </FormItem>
              )}
              />

              {/* To */}
              <FormField
                  control={form.control}
                  name="destination"
                  render={({ field }) => (
                  <FormItem className="p-4 border-l flex flex-col justify-center">
                      <FormLabel className="text-xs text-gray-500">TO</FormLabel>
                      <FormControl>
                      <Input placeholder="Mumbai" {...field} className="text-2xl font-bold border-0 p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0" />
                      </FormControl>
                  </FormItem>
                  )}
              />
              
              <FormField
                  control={form.control}
                  name="departureDate"
                  render={({ field }) => (
                    <FormItem className="p-4 border-l flex flex-col justify-center">
                       <FormLabel className="text-xs text-gray-500">DEPARTURE</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"ghost"}
                              className={cn(
                                "w-full pl-0 text-left font-normal border-0 p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0 hover:bg-transparent",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                             <div className="flex items-end">
                                {field.value ? (
                                    <>
                                        <span className="text-4xl font-bold">{format(field.value, "d")}</span>
                                        <span className="ml-2 text-lg font-semibold">{format(field.value, "MMM''yy")}</span>
                                    </>
                                ) : (
                                    <span className="text-2xl font-bold text-gray-400">Pick a date</span>
                                )}
                              </div>
                              <CalendarIcon className="ml-auto h-5 w-5 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={(date) => {
                                field.onChange(date);
                                if (tripType === 'roundtrip' && date && form.getValues('returnDate')) {
                                    const newDuration = differenceInCalendarDays(form.getValues('returnDate'), date) + 1;
                                    if (newDuration > 0) {
                                        form.setValue('tripDuration', newDuration, { shouldValidate: true });
                                    }
                                }
                            }}
                            disabled={(date) =>
                              date < new Date(new Date().setHours(0,0,0,0))
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      {field.value && <p className="text-sm text-muted-foreground -mt-1">{format(field.value, "EEEE")}</p>}
                    </FormItem>
                  )}
                />
              
              <FormField
                  control={form.control}
                  name="returnDate"
                  render={({ field }) => (
                    <FormItem className="p-4 border-l flex flex-col justify-center" onClick={() => { if (tripType === 'oneway') setTripType('roundtrip')}}>
                       <FormLabel className="text-xs text-gray-500">RETURN</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"ghost"}
                              disabled={tripType === 'oneway'}
                              className={cn(
                                "w-full pl-0 text-left font-normal border-0 p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0 disabled:opacity-100 hover:bg-transparent",
                                !field.value && tripType === 'roundtrip' && "text-muted-foreground"
                              )}
                            >
                            {field.value && tripType === 'roundtrip' ? (
                                <div className="flex items-end">
                                    <span className="text-4xl font-bold">{format(field.value, "d")}</span>
                                    <span className="ml-2 text-lg font-semibold">{format(field.value, "MMM''yy")}</span>
                                </div>
                            ) : (
                                <span className="text-sm font-medium text-gray-400">Book a round trip to save more</span>
                            )}
                              <CalendarIcon className="ml-auto h-5 w-5 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={(date) => {
                                field.onChange(date);
                                const departureDate = form.getValues('departureDate');
                                if (departureDate && date) {
                                     const newDuration = differenceInCalendarDays(date, departureDate) + 1;
                                    if (newDuration > 0) {
                                        form.setValue('tripDuration', newDuration, { shouldValidate: true });
                                    }
                                }
                            }}
                            disabled={(date) =>
                              date < (form.getValues("departureDate") || new Date())
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                        {field.value && tripType === 'roundtrip' && <p className="text-sm text-muted-foreground -mt-1">{format(field.value, "EEEE")}</p>}
                    </FormItem>
                  )}
                />

               <FormField
                  control={form.control}
                  name="travelPreference"
                  render={({ field }) => (
                  <FormItem className="p-4 border-l flex flex-col justify-center">
                      <FormLabel className="text-xs text-gray-500 flex items-center"><Users className="h-4 w-4 mr-1"/>TRAVEL PREFERENCES</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                          <SelectTrigger className="border-0 p-0 h-auto focus:ring-0 focus:ring-offset-0 text-left text-lg font-semibold">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                          <SelectItem value="budget">Budget-Friendly</SelectItem>
                          <SelectItem value="comfort">Comfort</SelectItem>
                          <SelectItem value="speed">Fastest Route</SelectItem>
                      </SelectContent>
                      </Select>
                      <FormMessage />
                  </FormItem>
                  )}
              />

              <Button type="submit" size="lg" disabled={isLoading} className="bg-accent hover:bg-accent/90 text-accent-foreground h-full rounded-l-none rounded-r-lg text-xl font-bold">
                  {isLoading ? (
                  <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current mr-2"></div>
                      SEARCH
                  </>
                  ) : <div className="flex items-center">SEARCH <ArrowRight className="ml-2"/></div>}
              </Button>
          </div>

          <div className="p-4 pt-6 border-t bg-gray-50 rounded-b-lg">
             <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr_1fr] gap-x-6 gap-y-4 items-start">
                <FormField
                    control={form.control}
                    name="tripDuration"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Duration (in days)</FormLabel>
                        <FormControl>
                            <Input 
                                type="number" 
                                min="1" 
                                {...field}
                                onChange={(e) => {
                                    const newDuration = parseInt(e.target.value, 10);
                                    field.onChange(newDuration);
                                    if (tripType === 'roundtrip' && form.getValues('departureDate') && newDuration > 0) {
                                        const newReturnDate = addDays(form.getValues('departureDate'), newDuration - 1);
                                        form.setValue('returnDate', newReturnDate, { shouldValidate: true });
                                    }
                                }} 
                            />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="interests"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>What are your interests?</FormLabel>
                        <FormControl>
                            <Textarea
                            placeholder="e.g., A relaxing trip focused on beaches and local food"
                            className="resize-none"
                            {...field}
                            />
                        </FormControl>
                         <FormMessage />
                        </FormItem>
                    )}
                />
                 <div className="flex flex-col gap-2">
                    <div><FormLabel>&nbsp;</FormLabel></div>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" size="sm" className="w-full">
                                <SlidersHorizontal className="mr-2 h-4 w-4" /> More Filters
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80">
                            <div className="grid gap-4">
                                <div className="space-y-2">
                                    <h4 className="font-medium leading-none">Time Filters</h4>
                                    <p className="text-sm text-muted-foreground">Fine-tune your travel times.</p>
                                </div>
                                <div className="grid gap-4">
                                    <FormField
                                        control={form.control}
                                        name="departureTime"
                                        render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="flex items-center"><Clock className="mr-1 h-4 w-4"/>Departure Time</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value || 'any'}>
                                            <FormControl>
                                                <SelectTrigger>
                                                <SelectValue placeholder="Any time" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="any">Anytime</SelectItem>
                                                <SelectItem value="morning">Morning (5am - 12pm)</SelectItem>
                                                <SelectItem value="afternoon">Afternoon (12pm - 6pm)</SelectItem>
                                                <SelectItem value="evening">Evening (6pm - 11pm)</SelectItem>
                                            </SelectContent>
                                            </Select>
                                        </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="arrivalTime"
                                        render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="flex items-center"><Clock className="mr-1 h-4 w-4"/>Arrival Time</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value || 'any'}>
                                            <FormControl>
                                                <SelectTrigger>
                                                <SelectValue placeholder="Any time" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="any">Anytime</SelectItem>
                                                <SelectItem value="morning">Morning (5am - 12pm)</SelectItem>
                                                <SelectItem value="afternoon">Afternoon (12pm - 6pm)</SelectItem>
                                                <SelectItem value="evening">Evening (6pm - 11pm)</SelectItem>
                                            </SelectContent>
                                            </Select>
                                        </FormItem>
                                        )}
                                    />
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>
                    {activeFilters.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-2">
                            {activeFilters.map(filter => (
                                <FilterBadge
                                    key={filter.id}
                                    label={filter.label}
                                    value={filter.value}
                                    onRemove={filter.onRemove}
                                />
                            ))}
                        </div>
                    )}
                 </div>
            </div>
          </div>
        </CardContent>
    </Card>
    );
}
