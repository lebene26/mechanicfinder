"use client";

import { useEffect, useMemo, useRef } from "react";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";
import { Loader2 } from "lucide-react";
import { GHANA_DEFAULT_CENTER } from "@/lib/geo";
import { getGoogleMapsApiKey, GOOGLE_MAPS_LIBRARIES } from "@/lib/google-maps";

export interface MapMechanic {
  id: string;
  workshop_name: string;
  latitude: number;
  longitude: number;
}

interface MechanicsMapProps {
  mechanics: MapMechanic[];
  userLocation?: { lat: number; lng: number } | null;
  selectedId?: string | null;
  onSelectMechanic?: (id: string) => void;
  className?: string;
}

const mapContainerStyle = { width: "100%", height: "100%" };

export function MechanicsMap({
  mechanics,
  userLocation,
  selectedId,
  onSelectMechanic,
  className = "h-64",
}: MechanicsMapProps) {
  const mapRef = useRef<google.maps.Map | null>(null);
  const apiKey = getGoogleMapsApiKey();

  const { isLoaded, loadError } = useJsApiLoader({
    id: "mechanic-finder-google-maps",
    googleMapsApiKey: apiKey,
    libraries: GOOGLE_MAPS_LIBRARIES,
  });

  const center = useMemo(() => {
    if (selectedId) {
      const selected = mechanics.find((m) => m.id === selectedId);
      if (selected) {
        return { lat: selected.latitude, lng: selected.longitude };
      }
    }
    if (mechanics.length > 0) {
      return { lat: mechanics[0].latitude, lng: mechanics[0].longitude };
    }
    if (userLocation) return userLocation;
    return GHANA_DEFAULT_CENTER;
  }, [mechanics, selectedId, userLocation]);

  useEffect(() => {
    if (!isLoaded || !mapRef.current || mechanics.length === 0) return;

    const bounds = new google.maps.LatLngBounds();
    mechanics.forEach((m) => {
      bounds.extend({ lat: m.latitude, lng: m.longitude });
    });
    if (userLocation) {
      bounds.extend(userLocation);
    }
    mapRef.current.fitBounds(bounds, 48);
  }, [isLoaded, mechanics, userLocation]);

  if (!apiKey) {
    return (
      <div
        className={`flex items-center justify-center bg-muted/30 px-4 text-center text-sm text-muted-foreground ${className}`}
      >
        Add <code className="mx-1 rounded bg-muted px-1">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code>{" "}
        to your <code className="mx-1 rounded bg-muted px-1">.env.local</code> to enable the map.
      </div>
    );
  }

  if (loadError) {
    return (
      <div
        className={`flex items-center justify-center bg-muted/30 px-4 text-center text-sm text-destructive ${className}`}
      >
        Failed to load Google Maps. Check your API key and enabled APIs.
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div
        className={`flex items-center justify-center bg-muted/30 ${className}`}
      >
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (mechanics.length === 0) {
    return (
      <div
        className={`flex items-center justify-center bg-muted/30 px-4 text-center text-sm text-muted-foreground ${className}`}
      >
        No mechanics on the map yet. Mechanics must pin their workshop location in
        their profile.
      </div>
    );
  }

  return (
    <div className={className}>
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={center}
        zoom={12}
        onLoad={(map) => {
          mapRef.current = map;
        }}
        options={{
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
        }}
      >
        {userLocation && (
          <Marker
            position={userLocation}
            title="You are here"
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: "#2563eb",
              fillOpacity: 1,
              strokeColor: "#ffffff",
              strokeWeight: 2,
            }}
          />
        )}
        {mechanics.map((mechanic) => (
          <Marker
            key={mechanic.id}
            position={{ lat: mechanic.latitude, lng: mechanic.longitude }}
            title={mechanic.workshop_name}
            onClick={() => onSelectMechanic?.(mechanic.id)}
            animation={
              mechanic.id === selectedId
                ? google.maps.Animation.BOUNCE
                : undefined
            }
          />
        ))}
      </GoogleMap>
    </div>
  );
}
