
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
import { AppLocationService } from '@/lib/location-service';
import { handleGeocodeLocation } from '@/app/actions';

type Activity = NonNullable<GeneratePersonalizedItineraryOutput['dailyPlan'][0]['morning']>[0];

type LiveMapProps = {
    destination: string;
    origin: string;
    journeyStarted: boolean;
    simulationStarted: boolean;
    selectedActivity: Activity | null;
    checkpoints: Activity[];
    currentCheckpointIndex: number;
};

const LiveMap = ({
    destination,
    origin,
    journeyStarted,
    simulationStarted,
    selectedActivity,
    checkpoints,
    currentCheckpointIndex
}: LiveMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<Map | null>(null);
  const vectorSourceRef = useRef<VectorSource<Point | LineString> | null>(null);
  const userLocationFeatureRef = useRef<Feature<Point> | null>(null);
  const nextDestinationFeatureRef = useRef<Feature<Point> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchCoords = async (location: string): Promise<[number, number] | null> => {
    try {
      if (!location) return null;
      let data = await handleGeocodeLocation(location);
      
      if (!data || data.length === 0) {
          const queryWithCity = `${location}, ${destination}`;
          data = await handleGeocodeLocation(queryWithCity);
      }

      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        return [parseFloat(lon), parseFloat(lat)];
      }

      console.error(`No coordinates found for "${location}"`);
      return null;
    } catch (err: any) {
        console.error(`Error fetching coordinates for "${location}":`, err.message);
        return null;
    }
  };


  const handlePositionUpdate = (position: GeolocationPosition) => {
    const coords = fromLonLat([position.coords.longitude, position.coords.latitude]);
    if (userLocationFeatureRef.current) {
        userLocationFeatureRef.current.getGeometry()?.setCoordinates(coords);
    }
  };

  const handleGpsError = (error: GeolocationPositionError) => {
    setError(`GPS Error: ${error.message}`);
    setTimeout(() => setError(null), 5000);
  };

  // Initialize map effect
  useEffect(() => {
    if (!mapRef.current) return;
    
    let isMounted = true;
    
    const initializeMap = async () => {
      const [originCoords, destinationCoords] = await Promise.all([
        fetchCoords(origin),
        fetchCoords(destination)
      ]);

      if (!isMounted) return;

      if (!originCoords || !destinationCoords) {
        setError(`Could not find coordinates for origin or destination.`);
        if (mapRef.current) mapRef.current.innerHTML = '<div class="flex items-center justify-center h-full text-muted-foreground">Map data unavailable.</div>';
        return;
      }
      
      const from = fromLonLat(originCoords);
      const to = fromLonLat(destinationCoords);

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
      
      const nextDestinationFeature = new Feature({
          geometry: new Point(to),
      });
      nextDestinationFeature.setStyle(new Style({
          image: new CircleStyle({
              radius: 8,
              fill: new Fill({ color: 'rgba(239, 68, 68, 0.7)'}),
              stroke: new Stroke({ color: '#FFFFFF', width: 2 })
          })
      }));
      nextDestinationFeature.set('type', 'destination');
      nextDestinationFeatureRef.current = nextDestinationFeature;

      vectorSource.addFeatures([userLocationFeature, nextDestinationFeature]);

      const vectorLayer = new VectorLayer({ source: vectorSource });
      
      const view = new View({
        center: from,
        zoom: 10,
      });

      const extent = new LineString([from, to]).getExtent();
      view.fit(extent, { duration: 1000, maxZoom: 14, padding: [100, 100, 100, 100] });
      
      const map = new Map({
        target: mapRef.current!,
        layers: [new TileLayer({ source: new OSM() }), vectorLayer],
        view: view,
      });
      
      mapInstanceRef.current = map;
      
      AppLocationService.watch(handlePositionUpdate, handleGpsError);
    };

    initializeMap();

    return () => {
      isMounted = false;
      mapInstanceRef.current?.setTarget(undefined);
    };
  }, [origin, destination]);


  // Update map view and "next destination" marker based on journey state
  useEffect(() => {
    const map = mapInstanceRef.current;
    const nextDestFeature = nextDestinationFeatureRef.current;
    const userLocationFeature = userLocationFeatureRef.current;

    if (!map || !nextDestFeature || !userLocationFeature) return;

    const updateUserAndNextDest = async (nextLocationName: string) => {
        let locationToSearch = nextLocationName;
        // Handle generic hotel/accommodation placeholders
        if (locationToSearch.toLowerCase().includes('hotel') || locationToSearch.toLowerCase().includes('accommodation')) {
            const isGeneric = /budget|luxury|mid-range/i.test(locationToSearch);
            if(isGeneric) {
                locationToSearch = destination; // Default to the main destination city
            }
        }
        
        let nextDestCoords = await fetchCoords(locationToSearch);

        // This is our new, more robust fallback logic
        if (!nextDestCoords) {
            setError(`Could not find "${locationToSearch}".`);
            setTimeout(() => setError(null), 5000);

            // SIMULATION FALLBACK: Find next valid point and create dummy location
            if (simulationStarted) {
                for (let i = currentCheckpointIndex + 1; i < checkpoints.length; i++) {
                    const nextValidCoords = await fetchCoords(checkpoints[i].location);
                    if (nextValidCoords) {
                        // Create a dummy coordinate slightly offset from the next valid one
                        nextDestCoords = [nextValidCoords[0] - 0.01, nextValidCoords[1] - 0.01];
                        setError(`Plotting dummy location for "${locationToSearch}" near next valid point.`);
                        setTimeout(() => setError(null), 5000);
                        break;
                    }
                }
            }
            
            // REGULAR USER FALLBACK: If still no coords, default to the main destination city
            if (!nextDestCoords) {
                 nextDestCoords = await fetchCoords(destination);
                 setError(`Defaulting map view to ${destination}.`);
                 setTimeout(() => setError(null), 5000);
            }
        }


        if (nextDestCoords) {
            const nextDestPoint = fromLonLat(nextDestCoords);
            nextDestFeature.getGeometry()?.setCoordinates(nextDestPoint);
            
            const userCoords = userLocationFeature.getGeometry()?.getCoordinates();
            if(userCoords) {
                 const view = map.getView();
                 const extent = new LineString([userCoords, nextDestPoint]).getExtent();
                 view.fit(extent, { duration: 1000, maxZoom: 14, padding: [100, 100, 100, 100] });
            }
        }
    };
    
    let nextStop: string | undefined;

    if (journeyStarted) {
      if (selectedActivity) {
        nextStop = selectedActivity.location;
      }
    } else {
      nextStop = destination; // Before journey, marker is on the main destination city
    }

    if (nextStop) {
      updateUserAndNextDest(nextStop);
    } else if (!journeyStarted) {
       // Reset to full view if journey ends and no activity is selected
        const userCoords = userLocationFeature.getGeometry()?.getCoordinates();
        const destCoords = nextDestFeature.getGeometry()?.getCoordinates();
        if (userCoords && destCoords) {
            const view = map.getView();
            const extent = new LineString([userCoords, destCoords]).getExtent();
            view.fit(extent, { duration: 1000, maxZoom: 14, padding: [100, 100, 100, 100] });
        }
    }

  }, [selectedActivity, journeyStarted, simulationStarted, destination, checkpoints, currentCheckpointIndex]);

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

    