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
    if (!response.ok) throw new Error('Failed to fetch from Nominatim');
    const data = await response.json();
    if (data.length === 0) throw new Error(`No coordinates for "${location}"`);
    const { lat, lon } = data[0];
    return [parseFloat(lon), parseFloat(lat)];
  } catch (err: any) {
    console.error(err);
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
  const vectorLayerRef = useRef<VectorLayer<VectorSource<Point | LineString>> | null>(null);
  const animationFrameRef = useRef<number | null>(null);
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

      if (!originCoords || !destCoords) {
        setError(`Could not fetch coordinates for ${!originCoords ? origin : ''} ${!destCoords ? destination : ''}`.trim());
        return;
      }
      
      const from = fromLonLat(originCoords);

      const vectorSource = new VectorSource();
      const vectorLayer = new VectorLayer({ source: vectorSource });
      vectorLayerRef.current = vectorLayer;

      const view = new View({
        center: from,
        zoom: 5,
      });
      
      const map = new Map({
        target: mapRef.current!,
        layers: [new TileLayer({ source: new OSM() }), vectorLayer],
        view: view,
      });
      
      mapInstanceRef.current = map;
      view.fit(new Point(fromLonLat(destCoords)).getExtent(), { duration: 1000, maxZoom: 12, padding: [100,100,100,100] });
    };

    initializeMap();

    return () => {
      isMounted = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      mapInstanceRef.current?.setTarget(undefined);
    };
  }, [origin, destination]);


  // Animate journey from origin to destination
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !vectorLayerRef.current) return;

    const source = vectorLayerRef.current.getSource();
    if (!source) return;

    const animateJourney = async () => {
        source.clear(); // Clear previous features

        const [originCoords, destCoords] = await Promise.all([fetchCoords(origin), fetchCoords(destination)]);
        if (!originCoords || !destCoords) return;

        const from = fromLonLat(originCoords);
        const to = fromLonLat(destCoords);
        
        const route = new LineString([from, to]);
        const routeFeature = new Feature({ geometry: route });
        routeFeature.setStyle(new Style({ stroke: new Stroke({ width: 6, color: '#3B82F6', lineDash: [8, 8] }) }));
        
        const movingFeature = new Feature({ geometry: new Point(from) });
        movingFeature.setStyle(new Style({
            image: new Icon({
                color: '#E44D26',
                crossOrigin: 'anonymous',
                src: 'https://openlayers.org/en/latest/examples/data/dot.svg',
                imgSize: [20, 20],
                anchor: [0.5, 0.5],
            }),
        }));
        
        source.addFeatures([routeFeature, movingFeature]);

        map.getView().fit(route.getExtent(), { duration: 1000, padding: [50, 50, 50, 50] });

        const duration = 5000; // 5 seconds for the journey
        let start: number | null = null;
        
        const move = (time: number) => {
            if (start === null) start = time;
            const elapsed = time - start;
            let fraction = elapsed / duration;
            if (fraction > 1) fraction = 1;

            const newCoord = route.getCoordinateAt(fraction);
            (movingFeature.getGeometry() as Point).setCoordinates(newCoord);
            
            if (fraction < 1) {
                animationFrameRef.current = requestAnimationFrame(move);
            } else {
                 if (selectedActivity) {
                    // Journey finished, now focus on the first activity
                    const flyToActivity = async () => {
                        const activityCoords = await fetchCoords(`${selectedActivity.location}, ${destination}`);
                        if (activityCoords) {
                            map.getView().animate({ center: fromLonLat(activityCoords), zoom: 15, duration: 1000 });
                        }
                    }
                    flyToActivity();
                }
            }
        };
        animationFrameRef.current = requestAnimationFrame(move);
    }
    
    if (journeyStarted) {
       animateJourney();
    } else {
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }
        source.clear();
    }

    return () => {
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
        }
    }
  }, [journeyStarted, origin, destination]);


  // Fly to selected activity
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedActivity || !journeyStarted) return;
    
    const flyToActivity = async () => {
      const coords = await fetchCoords(`${selectedActivity.location}, ${destination}`);
      if (coords) {
        const source = vectorLayerRef.current?.getSource();
        if(source) {
            source.clear(); // Clear the main journey route
            
            const activityFeature = new Feature({
                geometry: new Point(fromLonLat(coords)),
            });
            activityFeature.setStyle(new Style({
                image: new CircleStyle({
                    radius: 8,
                    fill: new Fill({ color: 'rgba(255, 138, 91, 0.7)'}), // Accent color
                    stroke: new Stroke({ color: '#FFFFFF', width: 2 })
                })
            }));
            source.addFeature(activityFeature);
        }

        map.getView().animate({
          center: fromLonLat(coords),
          zoom: 15,
          duration: 1000
        });
      } else {
          setError(`Could not find location: ${selectedActivity.location}`);
          setTimeout(() => setError(null), 3000); // Clear error after 3s
      }
    };

    // Only fly to activity if journey is complete (marker reached destination)
    if (!animationFrameRef.current) {
        flyToActivity();
    }

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
