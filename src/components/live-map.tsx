
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
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      mapInstanceRef.current?.setTarget(undefined);
    };
  }, [origin, destination]);


  // Animate journey from origin to destination
  useEffect(() => {
    const map = mapInstanceRef.current;
    const source = vectorSourceRef.current;
    if (!map || !source) return;

    const animateJourney = async () => {
        // Clear everything except the user location marker
        source.getFeatures().forEach(f => {
            if (f.get('type') !== 'user') {
                source.removeFeature(f);
            }
        });
        
        const [originCoords, destCoords] = await Promise.all([fetchCoords(origin), fetchCoords(destination)]);
        if (!originCoords || !destCoords) return;

        const from = fromLonLat(originCoords);
        const to = fromLonLat(destCoords);
        
        const route = new LineString([from, to]);
        const routeFeature = new Feature({ geometry: route });
        routeFeature.setStyle(new Style({ stroke: new Stroke({ width: 6, color: '#3B82F6', lineDash: [8, 8] }) }));
        
        const movingFeature = userLocationFeatureRef.current;
        if (!movingFeature) return;

        (movingFeature.getGeometry() as Point).setCoordinates(from);

        source.addFeature(routeFeature);

        map.getView().fit(route.getExtent(), { duration: 1000, padding: [50, 50, 50, 50] });

        const duration = 5000;
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
                 animationFrameRef.current = null;
                 source.removeFeature(routeFeature); // Remove journey line
                 if (selectedActivity) {
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
        // Don't clear source, just reset state if needed
        const userFeature = userLocationFeatureRef.current;
        if (userFeature) {
            const resetMap = async () => {
                const originCoords = await fetchCoords(origin);
                if (originCoords) {
                    (userFeature.getGeometry() as Point).setCoordinates(fromLonLat(originCoords));
                }
                const featuresToRemove = source.getFeatures().filter(f => f.get('type') === 'activity' || f.getGeometry()?.getType() === 'LineString');
                featuresToRemove.forEach(f => source.removeFeature(f));
            }
            resetMap();
        }
    }

    return () => {
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
        }
    }
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
    
    // Only update if journey animation is complete
    if (!animationFrameRef.current) {
        updateMarkers();
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


