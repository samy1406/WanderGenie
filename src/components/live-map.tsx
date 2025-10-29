
"use client";

import { useRef, useEffect, useState } from 'react';
import Map from 'ol/Map.js';
import OSM from 'ol/source/OSM.js';
import TileLayer from 'ol/layer/Tile.js';
import View from 'ol/View.js';
import { fromLonLat } from 'ol/proj.js';
import Feature from 'ol/Feature.js';
import Point from 'ol/geom/Point.js';
import LineString from 'ol/geom/LineString.js';
import { Vector as VectorLayer } from 'ol/layer.js';
import { Vector as VectorSource } from 'ol/source.js';
import { Style, Icon, Stroke, Fill, Circle as CircleStyle } from 'ol/style.js';
import type { GeneratePersonalizedItineraryOutput } from '@/ai/flows/generate-personalized-itinerary';

type Activity = GeneratePersonalizedItineraryOutput['dailyPlan'][0]['activities'][0];

const fetchCoords = async (location: string): Promise<[number, number] | null> => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&limit=1`
    );
    if (!response.ok) {
        console.error(`Failed to fetch from Nominatim: ${response.statusText}`);
        return null;
    };
    const data = await response.json();
    if (data.length === 0) {
        console.error(`No coordinates for "${location}"`);
        return null;
    };
    const { lat, lon } = data[0];
    return [parseFloat(lon), parseFloat(lat)];
  } catch (err: any) {
    console.error(`Error fetching coordinates for "${location}":`, err.message);
    return null;
  }
};

const LiveMap = ({ destination, origin, journeyStarted, selectedActivity }: { 
    destination: string, 
    origin: string, 
    journeyStarted: boolean,
    selectedActivity: Activity | null;
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<Map | null>(null);
  const vectorSourceRef = useRef<VectorSource<Point | LineString> | null>(null);
  const userLocationFeatureRef = useRef<Feature<Point> | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Initialize map effect
  useEffect(() => {
    if (!mapRef.current) return;
    
    let isMounted = true;
    
    const initializeMap = async () => {
      const [originCoords, destCoords] = await Promise.all([
        fetchCoords(origin),
        fetchCoords(destination)
      ]);

      if (!isMounted) return;

      if (!originCoords && !destCoords) {
        setError(`Could not find coordinates for origin or destination.`);
        // Don't initialize map if neither can be found
        if (mapRef.current) mapRef.current.innerHTML = '<div class="flex items-center justify-center h-full text-muted-foreground">Map data unavailable.</div>';
        return;
      }
      
      const centerCoords = destCoords || originCoords;
      const from = originCoords ? fromLonLat(originCoords) : null;
      const to = destCoords ? fromLonLat(destCoords) : null;

      const vectorSource = new VectorSource();
      vectorSourceRef.current = vectorSource;
      
      const features = [];

      if(from) {
        // User location marker (blue dot)
        const userLocationFeature = new Feature({
            geometry: new Point(from),
        });
        userLocationFeature.setStyle(new Style({
            image: new Icon({
                color: '#3B82F6',
                crossOrigin: 'anonymous',
                src: 'https://openlayers.org/en/latest/examples/data/dot.svg',
                imgSize: [20, 20],
                anchor: [0.5, 0.5],
            }),
        }));
        userLocationFeature.set('type', 'user');
        userLocationFeatureRef.current = userLocationFeature;
        features.push(userLocationFeature);
      } else {
        setError(`Could not find origin: ${origin}`);
      }

      if(to) {
        // Destination marker (red circle)
        const destinationFeature = new Feature({
            geometry: new Point(to),
        });
        destinationFeature.setStyle(new Style({
            image: new CircleStyle({
                radius: 8,
                fill: new Fill({ color: 'rgba(239, 68, 68, 0.7)'}), // Red color for destination
                stroke: new Stroke({ color: '#FFFFFF', width: 2 })
            })
        }));
        destinationFeature.set('type', 'destination');
        features.push(destinationFeature);
      } else {
         setError(`Could not find destination: ${destination}`);
      }
      
      vectorSource.addFeatures(features);

      const vectorLayer = new VectorLayer({ source: vectorSource });
      
      const view = new View({
        center: from || to || fromLonLat([0, 0]),
        zoom: 5,
      });
      
      const map = new Map({
        target: mapRef.current!,
        layers: [new TileLayer({ source: new OSM() }), vectorLayer],
        view: view,
      });
      
      mapInstanceRef.current = map;
      
      if (from && to) {
        // Fit map to show both origin and destination
        const routeForExtent = new LineString([from, to]);
        view.fit(routeForExtent.getExtent(), { duration: 1000, maxZoom: 12, padding: [100,100,100,100] });
      } else if (from) {
        view.animate({ center: from, zoom: 10, duration: 1000 });
      } else if (to) {
        view.animate({ center: to, zoom: 10, duration: 1000 });
      }
    };

    initializeMap();

    return () => {
      isMounted = false;
      mapInstanceRef.current?.setTarget(undefined);
    };
  }, [origin, destination]);


  // Handle journey state change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const handleJourneyState = async () => {
        if (journeyStarted) {
            // When journey starts, pan to the destination
            const destCoords = await fetchCoords(destination);
            if (destCoords) {
                const to = fromLonLat(destCoords);
                map.getView().animate({ center: to, zoom: 14, duration: 1500 });
            }
        } else {
            // When journey ends, fit map back to origin and destination
            const [originCoords, destCoords] = await Promise.all([
                fetchCoords(origin),
                fetchCoords(destination)
            ]);

            if (originCoords && destCoords) {
                const from = fromLonLat(originCoords);
                const to = fromLonLat(destCoords);
                const routeForExtent = new LineString([from, to]);
                map.getView().fit(routeForExtent.getExtent(), { duration: 1000, maxZoom: 12, padding: [100, 100, 100, 100] });
            }
        }
    }
    
    handleJourneyState();

  }, [journeyStarted, origin, destination]);


  // Update markers for selected activity
  useEffect(() => {
    const map = mapInstanceRef.current;
    const source = vectorSourceRef.current;
    const userFeature = userLocationFeatureRef.current;

    // Only run this logic if the journey has started
    if (!map || !source || !journeyStarted) {
        // If journey has not started, remove any existing activity markers
        if (source) {
            const prevActivityMarker = source.getFeatures().find(f => f.get('type') === 'activity');
            if (prevActivityMarker) {
                source.removeFeature(prevActivityMarker);
            }
        }
        return;
    };
    
    // If no activity is selected, just remove previous markers
    if (!selectedActivity) {
        const prevActivityMarker = source.getFeatures().find(f => f.get('type') === 'activity');
        if (prevActivityMarker) source.removeFeature(prevActivityMarker);
        return;
    }
    
    const updateMarkers = async () => {
      // Find and remove previous activity marker
      const prevActivityMarker = source.getFeatures().find(f => f.get('type') === 'activity');
      if (prevActivityMarker) {
        source.removeFeature(prevActivityMarker);
      }
      
      const activityCoords = await fetchCoords(`${selectedActivity.location}, ${destination}`);
      
      if (activityCoords) {
            const activityPosition = fromLonLat(activityCoords);
            const activityFeature = new Feature({
                geometry: new Point(activityPosition),
            });
            activityFeature.set('type', 'activity'); // Tag for easy removal
            activityFeature.setStyle(new Style({
                image: new CircleStyle({
                    radius: 8,
                    fill: new Fill({ color: 'rgba(255, 138, 91, 0.7)'}), // Accent color
                    stroke: new Stroke({ color: '#FFFFFF', width: 2 })
                })
            }));
            source.addFeature(activityFeature);
            
            // Pan to the activity
            const view = map.getView();
            view.animate({ center: activityPosition, zoom: 15, duration: 1000 });
      } else {
          setError(`Could not find location: ${selectedActivity.location}`);
          setTimeout(() => setError(null), 3000); // Clear error after 3s
      }
    };
    
    updateMarkers();

  }, [selectedActivity, journeyStarted, destination]);

  return (
    <div className="relative w-full h-full">
        {error && (
            <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 bg-destructive/80 text-destructive-foreground p-2 rounded-md text-xs">
            {error}
            </div>
        )}
        <div ref={mapRef} className="w-full h-full bg-muted" />
    </div>
  );
};

export default LiveMap;
