
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

      if (!originCoords || !destCoords) {
        setError(`Could not fetch coordinates for ${!originCoords ? origin : ''} ${!destCoords ? destination : ''}`.trim());
        return;
      }
      
      const from = fromLonLat(originCoords);
      const to = fromLonLat(destCoords);

      const vectorSource = new VectorSource();
      vectorSourceRef.current = vectorSource;

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
      
      vectorSource.addFeatures([userLocationFeature, destinationFeature]);

      const vectorLayer = new VectorLayer({ source: vectorSource });
      
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
      
      const routeForExtent = new LineString([from, to]);
      view.fit(routeForExtent.getExtent(), { duration: 1000, maxZoom: 12, padding: [100,100,100,100] });
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
    const source = vectorSourceRef.current;
    const userFeature = userLocationFeatureRef.current;
    if (!map || !source || !userFeature) return;

    const handleJourneyState = async () => {
        const featuresToRemove = source.getFeatures().filter(f => f.get('type') === 'activity' || f.get('type') === 'destination' || f.getGeometry()?.getType() === 'LineString');
        featuresToRemove.forEach(f => source.removeFeature(f));

        if (journeyStarted) {
            const destCoords = await fetchCoords(destination);
            if (destCoords) {
                const to = fromLonLat(destCoords);
                (userFeature.getGeometry() as Point).setCoordinates(to);
                map.getView().animate({ center: to, zoom: 14, duration: 1500 });
            }
        } else {
            // Reset to initial state
            const [originCoords, destCoords] = await Promise.all([
                fetchCoords(origin),
                fetchCoords(destination)
            ]);

            if (originCoords && destCoords) {
                const from = fromLonLat(originCoords);
                const to = fromLonLat(destCoords);

                (userFeature.getGeometry() as Point).setCoordinates(from);
                
                const destinationFeature = new Feature({ geometry: new Point(to) });
                 destinationFeature.setStyle(new Style({
                    image: new CircleStyle({
                        radius: 8,
                        fill: new Fill({ color: 'rgba(239, 68, 68, 0.7)'}),
                        stroke: new Stroke({ color: '#FFFFFF', width: 2 })
                    })
                }));
                destinationFeature.set('type', 'destination');
                source.addFeature(destinationFeature);

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
    if (!map || !source || !selectedActivity || !journeyStarted) return;
    
    const updateMarkers = async () => {
      // Find and remove previous activity marker
      const prevActivityMarker = source.getFeatures().find(f => f.get('type') === 'activity');
      if (prevActivityMarker) {
        source.removeFeature(prevActivityMarker);
      }
      
      const coords = await fetchCoords(`${selectedActivity.location}, ${destination}`);
      if (coords) {
            const activityFeature = new Feature({
                geometry: new Point(fromLonLat(coords)),
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
            
            // Pan to fit both user location and activity
            if (userLocationFeatureRef.current) {
                const userGeom = userLocationFeatureRef.current.getGeometry();
                if (userGeom) {
                  const view = map.getView();
                  const line = new LineString([userGeom.getCoordinates(), fromLonLat(coords)]);
                  view.fit(line.getExtent(), { duration: 1000, padding: [80,80,80,80], maxZoom: 15 });
                }
            }
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
