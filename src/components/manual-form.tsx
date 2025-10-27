"use client";

import type { UseFormReturn } from "react-hook-form";
import { useFieldArray } from "react-hook-form";
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
import { Wand2, Users, ArrowRight, BookOpen, Plus, CalendarIcon, Trash } from "lucide-react";
import { type formSchema } from "./itinerary-form";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Textarea } from "./ui/textarea";
import type { TripType } from "./trip-planner";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Calendar } from "./ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";


type ManualFormProps = {
  isLoading: boolean;
  form: UseFormReturn<z.infer<typeof formSchema>>;
  tripType: TripType;
};

export function ManualForm({ isLoading, form, tripType }: ManualFormProps) {
    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "destinations",
    });

    return (
        <div className="space-y-4">
        <div className="rounded-lg shadow-lg bg-white text-gray-700 grid grid-cols-[1fr_1fr_1fr_auto] items-end">
            {/* From */}
            <FormField
            control={form.control}
            name="origin"
            render={({ field }) => (
                <FormItem className="p-4">
                <FormLabel className="text-xs text-gray-500">FROM</FormLabel>
                <FormControl>
                    <Input placeholder="e.g., Delhi" {...field} className="text-2xl font-bold border-0 p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0" />
                </FormControl>
                </FormItem>
            )}
            />

            {/* To */}
            {tripType !== 'multicity' && (
                <FormField
                    control={form.control}
                    name="destination"
                    render={({ field }) => (
                    <FormItem className="p-4 border-l">
                        <FormLabel className="text-xs text-gray-500">TO</FormLabel>
                        <FormControl>
                        <Input placeholder="e.g., Mumbai" {...field} className="text-2xl font-bold border-0 p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0" />
                        </FormControl>
                    </FormItem>
                    )}
                />
            )}
            
            {tripType === 'roundtrip' && (
                <FormField
                control={form.control}
                name="returnDate"
                render={({ field }) => (
                  <FormItem className="p-4 border-l flex flex-col">
                    <FormLabel className="text-xs text-gray-500">RETURN</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal border-0 p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0 text-2xl font-bold",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span className="text-2xl font-bold text-gray-400">Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date < new Date() || date < new Date("1900-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </FormItem>
                )}
              />
            )}

            {tripType !== 'roundtrip' && tripType !== 'multicity' && (
                 <FormField
                    control={form.control}
                    name="travelPreference"
                    render={({ field }) => (
                    <FormItem className="p-4 border-l">
                        <FormLabel className="text-xs text-gray-500 flex items-center"><Users className="h-4 w-4 mr-1"/> TRAVELLER & PREFERENCE</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                            <SelectTrigger className="border-0 p-0 h-auto focus:ring-0 focus:ring-offset-0 text-left">
                            <SelectValue placeholder="Select your travel priority" />
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
            )}


            {/* Search Button */}
            <Button type="submit" size="lg" disabled={isLoading} className="bg-accent hover:bg-accent/90 text-accent-foreground h-full rounded-l-none rounded-r-md text-xl font-bold">
                {isLoading ? (
                <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current mr-2"></div>
                    SEARCH
                </>
                ) : "SEARCH"}
            </Button>
        </div>

        {tripType === 'multicity' && (
             <Card>
                <CardHeader>
                    <CardTitle>Destinations</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {fields.map((field, index) => (
                         <div key={field.id} className="flex items-center gap-2">
                             <FormField
                                control={form.control}
                                name={`destinations.${index}`}
                                render={({ field }) => (
                                    <FormItem className="flex-1">
                                    <FormControl>
                                        <Input placeholder={`City ${index + 1}`} {...field} />
                                    </FormControl>
                                    </FormItem>
                                )}
                                />
                            <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                onClick={() => remove(index)}
                                disabled={fields.length <= 1}
                            >
                                <Trash className="h-4 w-4" />
                            </Button>
                         </div>
                    ))}
                     <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => append("")}
                        >
                        <Plus className="mr-2 h-4 w-4" /> Add another city
                    </Button>
                </CardContent>
             </Card>
        )}

        <Card>
            <CardHeader>
                <CardTitle className="flex items-center text-lg">
                    <BookOpen className="mr-2"/>
                    Trip Details
                </CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-6">
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
                 <FormField
                    control={form.control}
                    name="travelPreference"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Travel Preference</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                            <SelectTrigger>
                            <SelectValue placeholder="Select your travel priority" />
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
            </CardContent>
      </Card>
    </div>
    );
}