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
import { Wand2, Users, ArrowRight, BookOpen, Plus } from "lucide-react";
import { type formSchema } from "./itinerary-form";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Textarea } from "./ui/textarea";

type ManualFormProps = {
  isLoading: boolean;
  form: UseFormReturn<z.infer<typeof formSchema>>;
};

export function ManualForm({ isLoading, form }: ManualFormProps) {
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
          
          {/* Traveller & Class */}
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
        </CardContent>
      </Card>
    </div>
  );
}
