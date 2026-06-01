"use client";

import { useCallback, useState } from "react";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";
import { Loader2, LocateFixed, MapPin, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GHANA_DEFAULT_CENTER } from "@/lib/geo";
import { getGoogleMapsApiKey, GOOGLE_MAPS_LIBRARIES } from "@/lib/google-maps";
import { toast } from "sonner";

interface WorkshopLocationPickerProps {
  latitude: number | null;
  longitude: number | null;
  onChange: (coords: { latitude: number; longitude: number }) => void;
  /** Used for address lookup, e.g. "Ring Road, East Legon, Accra, Ghana" */
  geocodeQuery?: string;
}

const mapContainerStyle = { width: "100%", height: "280px" };

export function WorkshopLocationPicker({
  latitude,
  longitude,
  onChange,
  geocodeQuery,
}: WorkshopLocationPickerProps) {
  const apiKey = getGoogleMapsApiKey();
  const [isLocating, setIsLocating] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);

  const { isLoaded, loadError } = useJsApiLoader({
    id: "mechanic-finder-google-maps",
    googleMapsApiKey: apiKey,
    libraries: GOOGLE_MAPS_LIBRARIES,
  });

  const position =
    latitude != null && longitude != null
      ? { lat: latitude, lng: longitude }
      : null;

  const handleMapClick = useCallback(
    (e: google.maps.MapMouseEvent) => {
      const lat = e.latLng?.lat();
      const lng = e.latLng?.lng();
      if (lat == null || lng == null) return;
      onChange({ latitude: lat, longitude: lng });
      toast.success("Workshop location updated");
    },
    [onChange]
  );

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation isn't supported on this device.");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onChange({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
        toast.success("Workshop location set from GPS");
        setIsLocating(false);
      },
      () => {
        toast.error("Could not get your location.");
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  const handleGeocodeAddress = async () => {
    const query = geocodeQuery?.trim();
    if (!query) {
      toast.error("Enter a street address and city first.");
      return;
    }
    if (!window.google?.maps) {
      toast.error("Google Maps is still loading.");
      return;
    }
    setIsGeocoding(true);
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ address: query }, (results, status) => {
      setIsGeocoding(false);
      if (status === "OK" && results?.[0]?.geometry?.location) {
        const loc = results[0].geometry.location;
        onChange({ latitude: loc.lat(), longitude: loc.lng() });
        toast.success("Found your address on the map");
      } else {
        toast.error("Could not find that address. Click the map to place your pin.");
      }
    });
  };

  if (!apiKey) {
    return (
      <p className="rounded-lg border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground">
        Set <code className="rounded bg-muted px-1">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> in{" "}
        <code className="rounded bg-muted px-1">.env.local</code> to pin your workshop on Google
        Maps.
      </p>
    );
  }

  if (loadError) {
    return (
      <p className="text-sm text-destructive">
        Failed to load Google Maps. Enable Maps JavaScript API and Geocoding API for your key.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleUseMyLocation}
          disabled={isLocating || !isLoaded}
        >
          {isLocating ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <LocateFixed className="mr-2 h-4 w-4" />
          )}
          Use my location
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleGeocodeAddress}
          disabled={isGeocoding || !isLoaded || !geocodeQuery?.trim()}
        >
          {isGeocoding ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Search className="mr-2 h-4 w-4" />
          )}
          Find address on map
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border border-border">
        {!isLoaded ? (
          <div className="flex h-[280px] items-center justify-center bg-muted/30">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={position ?? GHANA_DEFAULT_CENTER}
            zoom={position ? 15 : 7}
            onClick={handleMapClick}
            options={{
              streetViewControl: false,
              mapTypeControl: false,
            }}
          >
            {position && (
              <Marker
                position={position}
                draggable
                onDragEnd={(e) => {
                  const lat = e.latLng?.lat();
                  const lng = e.latLng?.lng();
                  if (lat == null || lng == null) return;
                  onChange({ latitude: lat, longitude: lng });
                }}
              />
            )}
          </GoogleMap>
        )}
      </div>

      <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
        <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        Click the map or drag the pin to set where clients will find your workshop.
        {position && (
          <span className="block w-full pt-1 font-mono">
            {position.lat.toFixed(5)}, {position.lng.toFixed(5)}
          </span>
        )}
      </p>
    </div>
  );
}
