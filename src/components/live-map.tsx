
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
            return await response.json();
        } catch (err: any) {
            console.error(`Error fetching coordinates for "${query}":`, err.message);
            return null;
        }
    }

    let data;

    const queries = [
        location,
        `${location}, ${destination}`,
        `${location.split(',')[0].trim()}, ${destination}`,
        `${location}, India`,
        `${location.split(',')[0].trim()}, India`,
    ];
    
    if (location.includes(',')) {
        queries.unshift(location.split(',')[0].trim()); // Higher priority for simplified name
        queries.push(location.substring(location.lastIndexOf(',') + 1).trim());
    }

    const uniqueQueries = [...new Set(queries.filter(q => q))];

    for (const query of uniqueQueries) {
        data = await search(query);
        if (data && data.length > 0) {
            break; 
        }
    }
    

    if (!data || data.length === 0) {
        console.error(`No coordinates found for "${location}" after all fallbacks.`);
        return null;
    }

    const { lat, lon } = data[0];
    return [parseFloat(lon), parseFloat(lat)];
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
      const [originCoords, destCoords] = await Promise.all([
        fetchCoords(origin),
        fetchCoords(destination)
      ]);

      if (!isMounted) return;

      if (!originCoords && !destCoords) {
        setError(`Could not find coordinates for origin or destination.`);
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
        const destinationFeature = new Feature({
            geometry: new Point(to),
        });
        destinationFeature.setStyle(new Style({
            image: new CircleStyle({
                radius: 8,
                fill: new Fill({ color: 'rgba(239, 68, 68, 0.7)'}),
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
        const routeForExtent = new LineString([from, to]);
        view.fit(routeForExtent.getExtent(), { duration: 1000, maxZoom: 12, padding: [100,100,100,100] });
      } else if (from) {
        view.animate({ center: from, zoom: 10, duration: 1000 });
      } else if (to) {
        view.animate({ center: to, zoom: 10, duration: 1000 });
      }
      
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
  }, [origin, destination]);

  // Admin logic effect
  useEffect(() => {
    if (user?.email === 'admin@wandergenie.com' && itineraryData) {
        AppLocationService.startSimulation();
        if (!isAdminPanelBuilt) {
            buildAdminPanel();
        }
    }
    const adminPanel = document.getElementById("admin-test-panel");
    if(adminPanel) {
        adminPanel.style.display = user?.email === 'admin@wandergenie.com' ? 'block' : 'none';
    }
  }, [user, isAdminPanelBuilt, itineraryData]);


  // Handle journey state change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const handleJourneyState = async () => {
        if (journeyStarted) {
            const destCoords = await fetchCoords(destination);
            if (destCoords) {
                const to = fromLonLat(destCoords);
                map.getView().animate({ center: to, zoom: 14, duration: 1500 });
            }
        } else {
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


  // Update markers for selected activity OR simulate journey
  useEffect(() => {
    const map = mapInstanceRef.current;
    const source = vectorSourceRef.current;
    
    if (!map || !source) return;

    const clearActivityMarkers = () => {
      const activityMarkers = source.getFeatures().filter(f => f.get('type') === 'activity' || f.get('type') === 'checkpoint');
      activityMarkers.forEach(marker => source.removeFeature(marker));
    }

    const showAllCheckpoints = async () => {
        clearActivityMarkers();
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
        if (allCoords.length > 0) {
            const lineString = new LineString(allCoords.map(c => fromLonLat(c)));
            map.getView().fit(lineString.getExtent(), { duration: 1000, maxZoom: 14, padding: [100, 100, 100, 100] });
        }
    };
    
    const updateSingleMarker = async () => {
      clearActivityMarkers();
      
      if (!selectedActivity) return;
      
      const activityCoords = await fetchCoords(selectedActivity.location);
      
      if (activityCoords) {
            const activityPosition = fromLonLat(activityCoords);
            const activityFeature = new Feature({ geometry: new Point(activityPosition) });
            activityFeature.set('type', 'activity');
            activityFeature.setStyle(new Style({
                image: new CircleStyle({
                    radius: 8,
                    fill: new Fill({ color: 'rgba(255, 138, 91, 0.7)'}),
                    stroke: new Stroke({ color: '#FFFFFF', width: 2 })
                })
            }));
            source.addFeature(activityFeature);
            
            map.getView().animate({ center: activityPosition, zoom: 15, duration: 1000 });
      } else {
          setError(`Could not find location: ${selectedActivity.location}`);
          setTimeout(() => setError(null), 3000);
      }
    };

    if (simulationStarted) {
        showAllCheckpoints();
    } else {
        if (journeyStarted) {
            updateSingleMarker();
        } else {
            clearActivityMarkers();
        }
    }

  }, [selectedActivity, journeyStarted, simulationStarted, destination, itineraryData]);

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
