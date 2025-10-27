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
import { Style, Icon, Stroke } from 'ol/style.js';

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

const LiveMap = ({ destination, origin, journeyStarted }: { destination: string, origin: string, journeyStarted: boolean }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<Map | null>(null);
  const vectorLayerRef = useRef<VectorLayer<VectorSource<Point | LineString>> | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;
    
    let isMounted = true;
    const movingFeature = new Feature({
        geometry: new Point(fromLonLat([0,0])),
    });
    
    movingFeature.setStyle(new Style({
        image: new Icon({
            color: '#E44D26',
            crossOrigin: 'anonymous',
            src: 'https://openlayers.org/en/latest/examples/data/dot.svg',
            imgSize: [20, 20],
            anchor: [0.5, 0.5],
        }),
    }));

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

      const route = new LineString([from, to]);
      const routeFeature = new Feature({
          geometry: route,
          name: 'Route',
      });
       routeFeature.setStyle(new Style({
        stroke: new Stroke({
          width: 6, color: '#3B82F6', lineDash: [8, 8]
        })
      }));
      
      const vectorSource = new VectorSource({
          features: [routeFeature, movingFeature]
      });

      const vectorLayer = new VectorLayer({
          source: vectorSource,
      });

      vectorLayerRef.current = vectorLayer;
      movingFeature.getGeometry()?.setCoordinates(from);

      const view = new View({
        center: from,
        zoom: 4,
        padding: [50, 50, 50, 50], // To ensure the whole route is visible
      });
      
      const map = new Map({
        target: mapRef.current!,
        layers: [new TileLayer({ source: new OSM() }), vectorLayer],
        view: view,
      });
      
      mapInstanceRef.current = map;
      view.fit(route, { duration: 1000 });
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


  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !vectorLayerRef.current) return;

    const source = vectorLayerRef.current.getSource();
    if (!source) return;

    const features = source.getFeatures();
    const routeFeature = features.find(f => f.getGeometry()?.getType() === 'LineString');
    const movingFeature = features.find(f => f.getGeometry()?.getType() === 'Point');

    if (!routeFeature || !movingFeature) return;
    
    const route = routeFeature.getGeometry() as LineString;
    const movingPoint = movingFeature.getGeometry() as Point;
    
    const duration = 10000; // 10 seconds for the journey
    let start: number | null = null;
    let animationId: number;

    const move = (time: number) => {
        if (start === null) start = time;
        const elapsed = time - start;
        const fraction = elapsed / duration;

        if (fraction < 1) {
            const newCoord = route.getCoordinateAt(fraction);
            movingPoint.setCoordinates(newCoord);
            
            const view = map.getView();
            view.setCenter(newCoord);

            animationId = requestAnimationFrame(move);
            animationFrameRef.current = animationId;
        } else {
            movingPoint.setCoordinates(route.getCoordinateAt(1));
        }
    };

    if (journeyStarted) {
        movingPoint.setCoordinates(route.getCoordinateAt(0)); // Reset to start
        animationId = requestAnimationFrame(move);
        animationFrameRef.current = animationId;
    } else {
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
        }
        movingPoint.setCoordinates(route.getCoordinateAt(0));
        map.getView().fit(route.getExtent(), { duration: 500, padding: [50, 50, 50, 50] });
    }

    return () => {
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
        }
    }

  }, [journeyStarted]);

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

    