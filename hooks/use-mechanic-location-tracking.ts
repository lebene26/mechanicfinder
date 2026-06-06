"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const MIN_UPDATE_INTERVAL_MS = 10_000;
const MIN_MOVE_METERS = 15;

function metersBetween(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const earthRadiusM = 6_371_000;
  const deltaLat = toRad(lat2 - lat1);
  const deltaLng = toRad(lng2 - lng1);
  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(deltaLng / 2) *
      Math.sin(deltaLng / 2);
  return earthRadiusM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

interface UseMechanicLocationTrackingOptions {
  requestId: string;
  enabled: boolean;
}

export function useMechanicLocationTracking({
  requestId,
  enabled,
}: UseMechanicLocationTrackingOptions) {
  const [isSharing, setIsSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const lastSentRef = useRef<{
    lat: number;
    lng: number;
    at: number;
  } | null>(null);

  useEffect(() => {
    if (!enabled) {
      setIsSharing(false);
      setError(null);
      return;
    }

    if (!navigator.geolocation) {
      setError("Geolocation is not supported on this device.");
      return;
    }

    const supabase = createClient();

    const publishLocation = async (position: GeolocationPosition) => {
      const { latitude, longitude, accuracy, heading } = position.coords;
      const now = Date.now();
      const last = lastSentRef.current;

      if (last) {
        const moved = metersBetween(last.lat, last.lng, latitude, longitude);
        const elapsed = now - last.at;
        if (moved < MIN_MOVE_METERS && elapsed < MIN_UPDATE_INTERVAL_MS) {
          return;
        }
      }

      const { error: upsertError } = await supabase
        .from("mechanic_live_locations")
        .upsert(
          {
            request_id: requestId,
            latitude,
            longitude,
            accuracy: accuracy ?? null,
            heading: Number.isFinite(heading) ? heading : null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "request_id" }
        );

      if (upsertError) {
        setError(upsertError.message);
        return;
      }

      lastSentRef.current = { lat: latitude, lng: longitude, at: now };
      setIsSharing(true);
      setError(null);
    };

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        void publishLocation(position);
      },
      (geoError) => {
        setIsSharing(false);
        if (geoError.code === geoError.PERMISSION_DENIED) {
          setError("Location permission denied. Enable it to share your live position.");
        } else {
          setError("Unable to read your location. Check GPS and try again.");
        }
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5_000,
        timeout: 15_000,
      }
    );

    return () => {
      if (watchIdRef.current != null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      lastSentRef.current = null;
      setIsSharing(false);

      void supabase
        .from("mechanic_live_locations")
        .delete()
        .eq("request_id", requestId);
    };
  }, [enabled, requestId]);

  return { isSharing, error };
}
