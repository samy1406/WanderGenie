
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
import { useAuth } from '@/context/auth-context';

type Activity = GeneratePersonalizedItineraryOutput['dailyPlan'][0]['activities'][0];

const LiveMap = ({ destination, origin, journeyStarted, simulationStarted, selectedActivity, itineraryData }: { 
    destination: string, 
    origin: string, 
    journeyStarted: boolean,
    simulationStarted: boolean,
    selectedActivity: Activity | null;
    itineraryData: GeneratePersonalizedItineraryOutput;
}) => {
  const { user } = useAuth();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<Map | null>(null);
  const vectorSourceRef = useRef<VectorSource<Point | LineString> | null>(null);
  const userLocationFeatureRef = useRef<Feature<Point> | null>(null);
  const nextDestinationFeatureRef = useRef<Feature<Point> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAdminPanelBuilt, setIsAdminPanelBuilt] = useState(false);

  const fetchCoords = async (location: string): Promise<[number, number] | null> => {
    const search = async (query: string) => {
        try {
            if (!query) return null;
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`
            );
            if (!response.ok) {
                console.error(`Failed to fetch from Nominatim for "${query}": ${response.statusText}`);
                return null;
            }
            const data = await response.json();
            return data;
        } catch (err: any) {
            console.error(`Error fetching coordinates for "${query}":`, err.message);
            return null;
        }
    }

    let data;

    // Create a set of unique queries to try for geocoding
    const queries = new Set<string>();
    queries.add(location);
    if (location.includes(',')) {
        queries.add(location.split(',')[0].trim());
    }
    queries.add(`${location}, India`);

    for (const query of queries) {
        if (!query) continue;
        data = await search(query);
        if (data && data.length > 0) {
            const { lat, lon } = data[0];
            return [parseFloat(lon), parseFloat(lat)];
        }
    }

    console.error(`No coordinates found for "${location}" after all fallbacks.`);
    return null;
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

  // Admin panel builder
  const buildAdminPanel = async () => {
    const checkpoints = [];
    
    const originCoords = await fetchCoords(origin);
    if (originCoords) checkpoints.push({ name: `Source: ${origin}`, lat: originCoords[1], lng: originCoords[0] });

    for (const day of itineraryData.dailyPlan) {
        for (const activity of day.activities) {
            const activityCoords = await fetchCoords(activity.location);
            if (activityCoords) {
                checkpoints.push({ name: `Day ${day.day}: ${activity.location}`, lat: activityCoords[1], lng: activityCoords[0]});
            }
        }
    }

    const destCoords = await fetchCoords(destination);
    if (destCoords) checkpoints.push({ name: `Destination: ${destination}`, lat: destCoords[1], lng: destCoords[0] });

    const existingPanel = document.getElementById("admin-test-panel");
    if (existingPanel) document.body.removeChild(existingPanel);

    const panel = document.createElement("div");
    panel.id = "admin-test-panel";
    panel.innerHTML = '<h3>Simulate Location</h3>';
    
    const buttonContainer = document.createElement("div");
    buttonContainer.id = "admin-panel-buttons";

    checkpoints.forEach(point => {
        const btn = document.createElement("button");
        btn.innerText = `Move to: ${point.name}`;
        btn.onclick = () => {
            AppLocationService.simulateNewLocation(point.lat, point.lng);
        };
        buttonContainer.appendChild(btn);
    });

    panel.appendChild(buttonContainer);
    
    const toggleBtn = document.createElement("button");
    toggleBtn.id = "admin-panel-toggle";
    toggleBtn.innerText = "Hide";
    toggleBtn.onclick = () => {
        if (buttonContainer.style.display === "none") {
            buttonContainer.style.display = "block";
            toggleBtn.innerText = "Hide";
        } else {
            buttonContainer.style.display = "none";
            toggleBtn.innerText = "Show";
        }
    };
    panel.appendChild(toggleBtn);


    document.body.appendChild(panel);
    setIsAdminPanelBuilt(true);
  };


  // Initialize map effect
  useEffect(() => {
    if (!mapRef.current) return;
    
    let isMounted = true;
    
    const initializeMap = async () => {
      // Fetch both origin and destination coordinates at the start
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
      
      // Initialize the destination marker at the correct destination coordinates
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
      const adminPanel = document.getElementById("admin-test-panel");
      if (adminPanel) {
        document.body.removeChild(adminPanel);
      }
    };
  }, [origin, destination]); // Rerun if origin or destination changes

  // Admin logic effect
  useEffect(() => {
    const adminPanel = document.getElementById('admin-test-panel');
    if (user?.email === 'admin@wandergenie.com' && itineraryData) {
        if (simulationStarted) {
            AppLocationService.startSimulation();
            if (!isAdminPanelBuilt) {
                buildAdminPanel();
            } else if(adminPanel) {
                adminPanel.style.display = 'block';
            }
        } else if (adminPanel) {
            adminPanel.style.display = 'none';
        }
    }
  }, [user, isAdminPanelBuilt, itineraryData, simulationStarted]);


  // Update map view and "next destination" marker based on journey state
  useEffect(() => {
    const map = mapInstanceRef.current;
    const nextDestFeature = nextDestinationFeatureRef.current;
    const userLocationFeature = userLocationFeatureRef.current;

    if (!map || !nextDestFeature || !userLocationFeature || !itineraryData) return;

    const updateUserAndNextDest = async (nextLocationName: string) => {
        const nextDestCoords = await fetchCoords(nextLocationName);

        if (nextDestCoords) {
            const nextDestPoint = fromLonLat(nextDestCoords);
            nextDestFeature.getGeometry()?.setCoordinates(nextDestPoint);
            
            const userCoords = userLocationFeature.getGeometry()?.getCoordinates();
            if(userCoords) {
                 const view = map.getView();
                 const extent = new LineString([userCoords, nextDestPoint]).getExtent();
                 view.fit(extent, { duration: 1000, maxZoom: 14, padding: [100, 100, 100, 100] });
            }
        } else {
            setError(`Could not find location: ${nextLocationName}`);
            setTimeout(() => setError(null), 3000);
        }
    };
    
    let nextStop: string;

    if (journeyStarted) {
      if (selectedActivity) {
        nextStop = selectedActivity.location;
      } else if (itineraryData.dailyPlan.length > 0 && itineraryData.dailyPlan[0].activities.length > 0) {
        nextStop = itineraryData.dailyPlan[0].activities[0].location;
      } else {
        nextStop = destination;
      }
      updateUserAndNextDest(nextStop);
    } else {
      // Before journey starts, the marker should be on the main destination city,
      // which is already set during initialization. We only need to potentially refit the view.
      if (nextDestFeature.getGeometry()) {
        const userCoords = userLocationFeature.getGeometry()?.getCoordinates();
        const destCoords = nextDestFeature.getGeometry()?.getCoordinates();
        if (userCoords && destCoords) {
            const view = map.getView();
            const extent = new LineString([userCoords, destCoords]).getExtent();
            view.fit(extent, { duration: 1000, maxZoom: 14, padding: [100, 100, 100, 100] });
        }
      }
    }
    
    // Logic for simulation mode checkpoints
    const source = vectorSourceRef.current;
    if (!source) return;

    const clearCheckpoints = () => {
        const checkpoints = source.getFeatures().filter(f => f.get('type') === 'checkpoint');
        checkpoints.forEach(marker => source.removeFeature(marker));
    };

    const showAllCheckpoints = async () => {
        clearCheckpoints();
        const allCoords = [];

        for (const day of itineraryData.dailyPlan) {
            for (const activity of day.activities) {
                const coords = await fetchCoords(activity.location);
                if (coords) {
                    allCoords.push(coords);
                    const feature = new Feature({ geometry: new Point(fromLonLat(coords)) });
                    feature.set('type', 'checkpoint');
                    feature.setStyle(new Style({
                        image: new CircleStyle({
                            radius: 6,
                            fill: new Fill({ color: 'rgba(52, 149, 219, 0.7)' }),
                            stroke: new Stroke({ color: '#FFFFFF', width: 1.5 })
                        })
                    }));
                    source.addFeature(feature);
                }
            }
        }
    };

    if (simulationStarted) {
        showAllCheckpoints();
    } else {
        clearCheckpoints();
    }

  }, [selectedActivity, journeyStarted, simulationStarted, itineraryData]);

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

    