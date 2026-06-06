"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  GoogleMap,
  Marker,
  useJsApiLoader,
} from "@react-google-maps/api";
import { formatDistanceToNow } from "date-fns";
import { Loader2, MapPin, Navigation } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { distanceInKm, GHANA_DEFAULT_CENTER } from "@/lib/geo";
import { getGoogleMapsApiKey, GOOGLE_MAPS_LIBRARIES } from "@/lib/google-maps";
import type { MechanicLiveLocation } from "@/lib/types";

interface LiveTrackingMapProps {
  requestId: string;
  clientLocation?: { lat: number; lng: number } | null;
  mechanicName?: string;
  isTrackingActive: boolean;
  className?: string;
}

const mapContainerStyle = { width: "100%", height: "100%" };
const STALE_LOCATION_MS = 2 * 60 * 1000;

export function LiveTrackingMap({
  requestId,
  clientLocation,
  mechanicName = "Mechanic",
  isTrackingActive,
  className = "h-56",
}: LiveTrackingMapProps) {
  const mapRef = useRef<google.maps.Map | null>(null);
  const [mechanicLocation, setMechanicLocation] =
    useState<MechanicLiveLocation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const apiKey = getGoogleMapsApiKey();

  const { isLoaded, loadError } = useJsApiLoader({
    id: "mechanic-finder-google-maps",
    googleMapsApiKey: apiKey,
    libraries: GOOGLE_MAPS_LIBRARIES,
  });

  const fitMapToMarkers = useCallback(() => {
    if (!mapRef.current) return;

    const points: google.maps.LatLngLiteral[] = [];
    if (clientLocation) points.push(clientLocation);
    if (mechanicLocation) {
      points.push({
        lat: mechanicLocation.latitude,
        lng: mechanicLocation.longitude,
      });
    }

    if (points.length === 0) return;

    if (points.length === 1) {
      mapRef.current.setCenter(points[0]);
      mapRef.current.setZoom(14);
      return;
    }

    const bounds = new google.maps.LatLngBounds();
    points.forEach((point) => bounds.extend(point));
    mapRef.current.fitBounds(bounds, 64);
  }, [clientLocation, mechanicLocation]);

  useEffect(() => {
    if (!isTrackingActive) {
      setMechanicLocation(null);
      setIsLoading(false);
      return;
    }

    const supabase = createClient();
    let cancelled = false;

    const loadInitial = async () => {
      const { data } = await supabase
        .from("mechanic_live_locations")
        .select("*")
        .eq("request_id", requestId)
        .maybeSingle();

      if (!cancelled) {
        setMechanicLocation(data);
        setIsLoading(false);
      }
    };

    void loadInitial();

    const channel = supabase
      .channel(`live-location:${requestId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "mechanic_live_locations",
          filter: `request_id=eq.${requestId}`,
        },
        (payload) => {
          if (payload.eventType === "DELETE") {
            setMechanicLocation(null);
            return;
          }
          setMechanicLocation(payload.new as MechanicLiveLocation);
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [isTrackingActive, requestId]);

  useEffect(() => {
    if (!isLoaded) return;
    fitMapToMarkers();
  }, [isLoaded, fitMapToMarkers, mechanicLocation, clientLocation]);

  const distanceKm = useMemo(() => {
    if (!clientLocation || !mechanicLocation) return null;
    return distanceInKm(
      clientLocation.lat,
      clientLocation.lng,
      mechanicLocation.latitude,
      mechanicLocation.longitude
    );
  }, [clientLocation, mechanicLocation]);

  const isStale =
    mechanicLocation &&
    Date.now() - new Date(mechanicLocation.updated_at).getTime() >
      STALE_LOCATION_MS;

  const initialCenter = useMemo(() => {
    if (clientLocation) return clientLocation;
    if (mechanicLocation) {
      return {
        lat: mechanicLocation.latitude,
        lng: mechanicLocation.longitude,
      };
    }
    return GHANA_DEFAULT_CENTER;
  }, [clientLocation, mechanicLocation]);

  if (!isTrackingActive) {
    return null;
  }

  if (!apiKey) {
    return (
      <div
        className={`flex items-center justify-center rounded-xl border border-border bg-muted/30 px-4 text-center text-sm text-muted-foreground ${className}`}
      >
        Add your Google Maps API key to enable live tracking.
      </div>
    );
  }

  if (loadError) {
    return (
      <div
        className={`flex items-center justify-center rounded-xl border border-border bg-muted/30 px-4 text-center text-sm text-destructive ${className}`}
      >
        Failed to load the tracking map.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Navigation className="h-4 w-4 text-primary" />
          Live mechanic location
        </div>
        {distanceKm != null && (
          <span className="text-xs text-muted-foreground">
            ~{distanceKm < 1 ? `${Math.round(distanceKm * 1000)} m` : `${distanceKm.toFixed(1)} km`} away
          </span>
        )}
      </div>

      <div
        className={`relative overflow-hidden rounded-xl border border-border ${className}`}
      >
        {!isLoaded || isLoading ? (
          <div className="flex h-full items-center justify-center bg-muted/30">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={initialCenter}
            zoom={13}
            onLoad={(map) => {
              mapRef.current = map;
              fitMapToMarkers();
            }}
            options={{
              streetViewControl: false,
              mapTypeControl: false,
              fullscreenControl: false,
              gestureHandling: "greedy",
            }}
          >
            {clientLocation && (
              <Marker
                position={clientLocation}
                title="Your location"
                zIndex={2}
                icon={{
                  path: google.maps.SymbolPath.CIRCLE,
                  scale: 9,
                  fillColor: "#2563eb",
                  fillOpacity: 1,
                  strokeColor: "#ffffff",
                  strokeWeight: 2,
                }}
              />
            )}
            {mechanicLocation && (
              <Marker
                position={{
                  lat: mechanicLocation.latitude,
                  lng: mechanicLocation.longitude,
                }}
                title={mechanicName}
                zIndex={3}
                icon={{
                  path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                  scale: 6,
                  fillColor: "#ea580c",
                  fillOpacity: 1,
                  strokeColor: "#ffffff",
                  strokeWeight: 2,
                  rotation: mechanicLocation.heading ?? 0,
                }}
              />
            )}
          </GoogleMap>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3 px-1 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-blue-600" />
          Your location
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-orange-600" />
          {mechanicName}
        </span>
        {mechanicLocation ? (
          <span className={isStale ? "text-amber-600 dark:text-amber-400" : ""}>
            {isStale ? "Last seen " : "Updated "}
            {formatDistanceToNow(new Date(mechanicLocation.updated_at), {
              addSuffix: true,
            })}
          </span>
        ) : (
          <span>Waiting for mechanic to share location…</span>
        )}
        {clientLocation && (
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${clientLocation.lat},${clientLocation.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-primary hover:underline"
          >
            <MapPin className="h-3 w-3" />
            Open in Maps
          </a>
        )}
      </div>
    </div>
  );
}
