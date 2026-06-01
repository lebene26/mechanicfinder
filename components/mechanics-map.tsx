"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  GoogleMap,
  InfoWindow,
  Marker,
  useJsApiLoader,
} from "@react-google-maps/api";
import { Loader2 } from "lucide-react";
import { GHANA_DEFAULT_CENTER } from "@/lib/geo";
import { getGoogleMapsApiKey, GOOGLE_MAPS_LIBRARIES } from "@/lib/google-maps";

export interface MapMechanic {
  id: string;
  workshop_name: string;
  latitude: number;
  longitude: number;
  is_available?: boolean;
}

interface MechanicsMapProps {
  mechanics: MapMechanic[];
  userLocation?: { lat: number; lng: number } | null;
  selectedId?: string | null;
  onSelectMechanic?: (id: string) => void;
  onRequestService?: (id: string) => void;
  className?: string;
}

const mapContainerStyle = { width: "100%", height: "100%" };

export function MechanicsMap({
  mechanics,
  userLocation,
  selectedId,
  onSelectMechanic,
  onRequestService,
  className = "h-64",
}: MechanicsMapProps) {
  const mapRef = useRef<google.maps.Map | null>(null);
  const [infoWindowId, setInfoWindowId] = useState<string | null>(null);
  const initialCenter = useMemo(() => GHANA_DEFAULT_CENTER, []);
  const apiKey = getGoogleMapsApiKey();

  const { isLoaded, loadError } = useJsApiLoader({
    id: "mechanic-finder-google-maps",
    googleMapsApiKey: apiKey,
    libraries: GOOGLE_MAPS_LIBRARIES,
  });

  const fitMapToMechanics = useCallback(() => {
    if (!mapRef.current || mechanics.length === 0) return;

    const bounds = new google.maps.LatLngBounds();
    mechanics.forEach((m) => {
      bounds.extend({ lat: m.latitude, lng: m.longitude });
    });
    if (userLocation) {
      bounds.extend(userLocation);
    }
    mapRef.current.fitBounds(bounds, 48);
  }, [mechanics, userLocation]);

  useEffect(() => {
    if (!isLoaded) return;
    fitMapToMechanics();
  }, [isLoaded, fitMapToMechanics]);

  useEffect(() => {
    if (!isLoaded || !mapRef.current || !selectedId) return;
    const selected = mechanics.find((m) => m.id === selectedId);
    if (!selected) return;
    mapRef.current.panTo({ lat: selected.latitude, lng: selected.longitude });
  }, [isLoaded, selectedId, mechanics]);

  const handleMarkerClick = useCallback(
    (mechanic: MapMechanic) => {
      setInfoWindowId(mechanic.id);
      onSelectMechanic?.(mechanic.id);
      mapRef.current?.panTo({ lat: mechanic.latitude, lng: mechanic.longitude });
      onRequestService?.(mechanic.id);
    },
    [onSelectMechanic, onRequestService]
  );

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
    <div className={`relative z-0 isolate ${className}`}>
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={initialCenter}
        zoom={7}
        onLoad={(map) => {
          mapRef.current = map;
          fitMapToMechanics();
        }}
        options={{
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
          gestureHandling: "greedy",
        }}
      >
        {userLocation && (
          <Marker
            position={userLocation}
            title="You are here"
            zIndex={1}
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
            zIndex={mechanic.id === selectedId ? 1000 : 2}
            onClick={() => handleMarkerClick(mechanic)}
          >
            {infoWindowId === mechanic.id && (
              <InfoWindow
                onCloseClick={() => setInfoWindowId(null)}
                options={{ maxWidth: 260 }}
              >
                <div className="space-y-2 pr-1">
                  <p className="text-sm font-semibold text-gray-900">
                    {mechanic.workshop_name}
                  </p>
                  {mechanic.is_available === false ? (
                    <p className="text-xs text-gray-600">Currently unavailable</p>
                  ) : (
                    <button
                      type="button"
                      className="w-full rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
                      onClick={(e) => {
                        e.stopPropagation();
                        setInfoWindowId(null);
                        onRequestService?.(mechanic.id);
                      }}
                    >
                      Request Service
                    </button>
                  )}
                </div>
              </InfoWindow>
            )}
          </Marker>
        ))}
      </GoogleMap>
    </div>
  );
}
