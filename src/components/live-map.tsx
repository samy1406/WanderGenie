"use client";

import { useRef, useEffect, useState } from 'react';
import Map from 'ol/Map.js';
import OSM from 'ol/source/OSM.js';
import TileLayer from 'ol/layer/Tile.js';
import View from 'ol/View.js';
import { fromLonLat } from 'ol/proj.js';
import Feature from 'ol/Feature.js';
import Point from 'ol/geom/Point.js';
import { Vector as VectorLayer } from 'ol/layer.js';
import { Vector as VectorSource } from 'ol/source.js';
import { Style, Icon } from 'ol/style.js';

const LiveMap = ({ destination }: { destination: string }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!mapRef.current) {
      return;
    }

    const fetchCoords = async () => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(destination)}&format=json&limit=1`
        );
        if (!response.ok) {
          throw new Error('Failed to fetch coordinates from Nominatim API');
        }
        const data = await response.json();
        if (data.length === 0) {
          throw new Error(`No coordinates found for "${destination}"`);
        }
        const { lat, lon } = data[0];
        return [parseFloat(lon), parseFloat(lat)];
      } catch (err: any) {
        setError(err.message || 'Could not fetch coordinates for the destination.');
        console.error(err);
        return null; // Return null if coordinates can't be fetched
      }
    };
    
    let map: Map | undefined;

    fetchCoords().then(coordinates => {
        if (!mapRef.current) return;
        
        let centerCoordinates = fromLonLat([78.9629, 20.5937]); // Default to India
        let zoom = 4;
        
        const layers = [
            new TileLayer({
                source: new OSM(),
            }),
        ];

        if (coordinates) {
            centerCoordinates = fromLonLat(coordinates);
            zoom = 12;
            const marker = new Feature({
              geometry: new Point(centerCoordinates),
            });

            marker.setStyle(new Style({
                image: new Icon({
                    color: '#E44D26',
                    crossOrigin: 'anonymous',
                    src: 'https://openlayers.org/en/latest/examples/data/dot.svg',
                    imgSize: [20, 20],
                    anchor: [0.5, 0.5],
                }),
            }));

            const vectorSource = new VectorSource({
              features: [marker],
            });

            const markerVectorLayer = new VectorLayer({
              source: vectorSource,
            });
            layers.push(markerVectorLayer);
        }

         map = new Map({
            target: mapRef.current,
            layers: layers,
            view: new View({
              center: centerCoordinates,
              zoom: zoom,
            }),
        });
    });


    return () => {
      if (map) {
        map.setTarget(undefined);
      }
    };
  }, [destination]);

   if (error) {
    return (
        <div className="w-full h-full bg-destructive/20 flex items-center justify-center text-destructive p-4 text-center">
           {error}
        </div>
    );
  }

  return <div ref={mapRef} className="w-full h-full bg-muted" />;
};

export default LiveMap;
