"use client";

import { useState, useEffect, useMemo } from 'react';
import { GoogleMap, useJsApiLoader, MarkerF } from '@react-google-maps/api';

const containerStyle = {
  width: '100%',
  height: '100%',
};

// Replace with a default location, e.g., a central point in a country or continent
const defaultCenter = {
  lat: 20.5937,
  lng: 78.9629 // India
};

const LiveMap = ({ destination }: { destination: string }) => {
  const [center, setCenter] = useState(defaultCenter);
  const [userPosition, setUserPosition] = useState<google.maps.LatLngLiteral | null>(null);
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries: ['places'],
  });

  const geocoder = useMemo(() => {
    if (isLoaded && window.google) {
      return new window.google.maps.Geocoder();
    }
    return null;
  }, [isLoaded]);

  useEffect(() => {
    if (geocoder && destination) {
      geocoder.geocode({ address: destination }, (results, status) => {
        if (status === 'OK' && results && results[0]) {
          const location = results[0].geometry.location;
          setCenter({ lat: location.lat(), lng: location.lng() });
        } else {
          console.error(`Geocode was not successful for the following reason: ${status}`);
        }
      });
    }
  }, [geocoder, destination]);
  
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserPosition({ lat: latitude, lng: longitude });
        },
        (error) => {
          console.error("Error getting user location:", error);
        }
      );
    }
  }, []);

  if (loadError) {
    return (
        <div className="w-full h-full bg-destructive/20 flex items-center justify-center text-destructive">
            Map cannot be loaded. Please check the API key.
        </div>
    );
  }

  return isLoaded ? (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={center}
      zoom={10}
      options={{
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: false,
      }}
    >
      <MarkerF position={center} label={{ text: "Destination", color: "white" }} />
      {userPosition && <MarkerF position={userPosition} label="You" />}
    </GoogleMap>
  ) : (
    <div className="w-full h-full bg-muted flex items-center justify-center">
        <p>Loading Map...</p>
    </div>
  );
};

export default LiveMap;
