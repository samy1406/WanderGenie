// src/components/admin-panel.tsx
'use client';
import { useAuth } from '@/context/auth-context';
import { AppLocationService } from '@/lib/location-service';
import { useEffect, useState } from 'react';
import type { GeneratePersonalizedItineraryOutput } from '@/ai/flows/generate-personalized-itinerary';

type AdminPanelProps = {
    origin: string;
    destination: string;
    itineraryData: GeneratePersonalizedItineraryOutput;
    simulationStarted: boolean;
};

const allActivities = (dailyPlan: GeneratePersonalizedItineraryOutput['dailyPlan']) =>
  dailyPlan.flatMap(day => [
    ...(day.morning || []),
    ...(day.afternoon || []),
    ...(day.evening || []),
    ...(day.night || [])
  ]);

const fetchCoords = async (location: string): Promise<[number, number] | null> => {
    try {
        if (!location) return null;
        // Try more specific query first
        const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&limit=1`);
        const data = await response.json();
        if (data && data.length > 0) {
            return [parseFloat(data[0].lon), parseFloat(data[0].lat)];
        }
        
        // Fallback to just city name if available
        if (location.includes(',')) {
            const city = location.split(',')[0].trim();
            const fallbackResponse = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1`);
            const fallbackData = await fallbackResponse.json();
            if (fallbackData && fallbackData.length > 0) {
                return [parseFloat(fallbackData[0].lon), parseFloat(fallbackData[0].lat)];
            }
        }
        
        return null; // No coordinates found
    } catch (error) {
        console.error("Error fetching coordinates for:", location, error);
        return null;
    }
};

export const AdminPanel = ({ origin, destination, itineraryData, simulationStarted }: AdminPanelProps) => {
    const { user } = useAuth();
    const [checkpoints, setCheckpoints] = useState<{ name: string; lat: number; lng: number }[]>([]);
    const [panelVisible, setPanelVisible] = useState(true);

    useEffect(() => {
        if (user?.email !== 'admin@wandergenie.com' || !simulationStarted) {
            return;
        }

        const buildCheckpoints = async () => {
            const points = [];
            const originCoords = await fetchCoords(origin);
            if (originCoords) points.push({ name: `Origin: ${origin}`, lat: originCoords[1], lng: originCoords[0] });
            
            for (const day of itineraryData.dailyPlan) {
              for (const activity of allActivities([day])) {
                const activityCoords = await fetchCoords(activity.location);
                if (activityCoords) {
                  points.push({ name: `Day ${day.day}: ${activity.location}`, lat: activityCoords[1], lng: activityCoords[0] });
                }
              }
            }

            const destCoords = await fetchCoords(destination);
            if (destCoords) points.push({ name: `Destination: ${destination}`, lat: destCoords[1], lng: destCoords[0] });

            setCheckpoints(points);
        };

        buildCheckpoints();
        AppLocationService.startSimulation();

    }, [user, origin, destination, itineraryData, simulationStarted]);
    
    if (user?.email !== 'admin@wandergenie.com' || !simulationStarted) {
        return null;
    }

    return (
        <div id="admin-test-panel" style={{
            position: 'fixed', bottom: '20px', left: '20px', background: '#fff', border: '2px solid #000', padding: '15px', zIndex: 10000, borderRadius: '8px', boxShadow: '0 4px 10px rgba(0,0,0,0.2)', fontFamily: 'sans-serif'
        }}>
            <h3 style={{ marginTop: 0, color: 'black' }}>Simulate Location</h3>
            <div id="admin-panel-buttons" style={{ display: panelVisible ? 'block' : 'none', maxHeight: '200px', overflowY: 'auto' }}>
                {checkpoints.map(point => (
                    <button key={point.name} onClick={() => AppLocationService.simulateNewLocation(point.lat, point.lng)} style={{
                        display: 'block', width: '100%', marginTop: '5px', padding: '8px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer'
                    }}>
                        {point.name}
                    </button>
                ))}
            </div>
            <button id="admin-panel-toggle" onClick={() => setPanelVisible(!panelVisible)} style={{
                display: 'block', width: '100%', marginTop: '10px', padding: '8px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer'
            }}>
                {panelVisible ? 'Hide' : 'Show'}
            </button>
        </div>
    );
};

    