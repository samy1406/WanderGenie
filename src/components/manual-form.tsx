
"use client";

import type { UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Users, CalendarIcon, ArrowRight, Clock, SlidersHorizontal, UserPlus, Baby, PersonStanding, X } from "lucide-react";
import { type formSchema } from "./itinerary-form";
import { Card, CardContent } from "./ui/card";
import { Textarea } from "./ui/textarea";
import type { TripType } from "./trip-planner";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Calendar } from "./ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
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
        if (watchAllFields.adults > 1) {
            filters.push({ 
                id: 'adults',
                label: 'Adults', 
                value: watchAllFields.adults, 
                onRemove: () => form.setValue('adults', 1) 
            });
        }
        if (watchAllFields.children > 0) {
            filters.push({ 
                id: 'children',
                label: 'Children', 
                value: watchAllFields.children, 
                onRemove: () => form.setValue('children', 0) 
            });
        }
        if (watchAllFields.infants > 0) {
            filters.push({ 
                id: 'infants',
                label: 'Infants', 
                value: watchAllFields.infants, 
                onRemove: () => form.setValue('infants', 0) 
            });
        }
        return filters;
    }, [watchAllFields, form]);


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
                            onSelect={field.onChange}
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
                            onSelect={field.onChange}
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
                      <FormLabel className="text-xs text-gray-500 flex items-center"><Users className="h-4 w-4 mr-1"/>TRAVELLER & CLASS</FormLabel>
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
             <div className="grid grid-cols-[1fr_2fr_auto] gap-6 items-end">
                <FormField
                    control={form.control}
                    name="tripDuration"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Duration (in days)</FormLabel>
                        <FormControl>
                            <Input type="number" {...field} />
                        </FormControl>
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
                        </FormItem>
                    )}
                    />
                 <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="w-full md:w-auto self-end">
                            <SlidersHorizontal className="mr-2 h-4 w-4" /> More Filters
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80">
                         <div className="grid gap-4">
                            <div className="space-y-2">
                                <h4 className="font-medium leading-none">Filters</h4>
                                <p className="text-sm text-muted-foreground">Fine-tune your trip details.</p>
                            </div>
                            <div className="grid gap-4">
                                <h5 className="font-medium text-sm">Time Preferences</h5>
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

                                <h5 className="font-medium text-sm pt-2">Travelers</h5>
                                <FormField
                                    control={form.control}
                                    name="adults"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="flex items-center"><PersonStanding className="mr-2 h-4 w-4" />Adults</FormLabel>
                                            <FormControl><Input type="number" min={1} {...field} /></FormControl>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="children"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="flex items-center"><UserPlus className="mr-2 h-4 w-4" />Children (2-12 yrs)</FormLabel>
                                            <FormControl><Input type="number" min={0} {...field} /></FormControl>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="infants"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="flex items-center"><Baby className="mr-2 h-4 w-4" />Infants (below 2 yrs)</FormLabel>
                                            <FormControl><Input type="number" min={0} {...field} /></FormControl>
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>
                    </PopoverContent>
                </Popover>
            </div>
             {activeFilters.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-4">
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
        </CardContent>
    </Card>
    );
}
