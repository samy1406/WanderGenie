// src/components/admin-panel.tsx
'use client';
import { AppLocationService } from '@/lib/location-service';
import { useEffect, useState } from 'react';
import type { GeneratePersonalizedItineraryOutput } from '@/ai/flows/generate-personalized-itinerary';
import { handleGeocodeLocation } from '@/app/actions';

type Activity = NonNullable<GeneratePersonalizedItineraryOutput['dailyPlan'][0]['morning']>[0];

type AdminPanelProps = {
    nextCheckpoint: Activity | null;
    onNext: () => void;
};

const fetchCoords = async (location: string): Promise<[number, number] | null> => {
    try {
        if (!location) return null;
        const data = await handleGeocodeLocation(location);
        if (data && data.length > 0) {
            return [parseFloat(data[0].lon), parseFloat(data[0].lat)];
        }
        return null;
    } catch (error) {
        console.error("Error fetching coordinates for:", location, error);
        return null;
    }
};

export const AdminPanel = ({ nextCheckpoint, onNext }: AdminPanelProps) => {
    const [panelVisible, setPanelVisible] = useState(true);
    const [isMoving, setIsMoving] = useState(false);

    useEffect(() => {
        AppLocationService.startSimulation();
    }, []);

    const handleMoveToNext = async () => {
        if (!nextCheckpoint) return;
        setIsMoving(true);
        const coords = await fetchCoords(nextCheckpoint.location);
        if (coords) {
            AppLocationService.simulateNewLocation(coords[1], coords[0]);
            onNext(); // Tell the parent component to advance the checkpoint index
        }
        setIsMoving(false);
    }
    
    return (
        <div id="admin-test-panel" style={{
            position: 'fixed', bottom: '20px', left: '20px', background: '#fff', border: '2px solid #000', padding: '15px', zIndex: 10000, borderRadius: '8px', boxShadow: '0 4px 10px rgba(0,0,0,0.2)', fontFamily: 'sans-serif'
        }}>
            <h3 style={{ marginTop: 0, color: 'black' }}>Simulate Location</h3>
            <div id="admin-panel-buttons" style={{ display: panelVisible ? 'block' : 'none', minWidth: '200px' }}>
                {nextCheckpoint ? (
                    <button onClick={handleMoveToNext} disabled={isMoving} style={{
                        display: 'block', width: '100%', marginTop: '5px', padding: '8px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', opacity: isMoving ? 0.5 : 1
                    }}>
                        {isMoving ? 'Moving...' : `Move to: ${nextCheckpoint.description.replace(/\*\*/g, '')}`}
                    </button>
                ) : (
                    <p style={{color: 'black', fontSize: '14px'}}>End of trip!</p>
                )}
            </div>
            <button id="admin-panel-toggle" onClick={() => setPanelVisible(!panelVisible)} style={{
                display: 'block', width: '100%', marginTop: '10px', padding: '8px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer'
            }}>
                {panelVisible ? 'Hide' : 'Show'}
            </button>
        </div>
    );
};