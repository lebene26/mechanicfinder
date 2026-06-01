"use client";

import { useMemo, useRef, useState } from "react";
import Image from "next/image";
import {
  Search,
  MapPin,
  Star,
  Filter,
  X,
  Phone,
  MessageCircle,
  ChevronDown,
  Loader2,
  CheckCircle,
  Camera,
  ImagePlus,
  LocateFixed,
  Trash2,
  Navigation,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import {
  ACCEPTED_IMAGE_MIME_TYPES,
  MAX_REQUEST_IMAGE_BYTES,
  uploadRequestImage,
} from "@/lib/supabase/chat-media";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import type { MechanicProfile } from "@/lib/types";
import { LOCATIONS, SPECIALTIES } from "@/lib/types";
import { distanceInKm, hasCoordinates } from "@/lib/geo";
import { MechanicsMap } from "@/components/mechanics-map";

interface MechanicSearchProps {
  mechanics: MechanicProfile[];
  userId: string;
}

export function MechanicSearch({ mechanics, userId }: MechanicSearchProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState<string>("all");
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedMapMechanic, setSelectedMapMechanic] =
    useState<MechanicProfile | null>(null);
  const [userMapLocation, setUserMapLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [isLocatingMap, setIsLocatingMap] = useState(false);

  const [selectedMechanic, setSelectedMechanic] =
    useState<MechanicProfile | null>(null);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requestForm, setRequestForm] = useState<{
    serviceType: string;
    description: string;
    location: string;
    latitude: number | null;
    longitude: number | null;
  }>({
    serviceType: "",
    description: "",
    location: "",
    latitude: null,
    longitude: null,
  });
  const [isLocating, setIsLocating] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const resetRequestForm = () => {
    setRequestForm({
      serviceType: "",
      description: "",
      location: "",
      latitude: null,
      longitude: null,
    });
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview(null);
  };

  const handleImagePicked = (file: File | null | undefined) => {
    if (!file) return;
    if (!ACCEPTED_IMAGE_MIME_TYPES.includes(file.type as typeof ACCEPTED_IMAGE_MIME_TYPES[number])) {
      toast.error("Please choose a JPG, PNG, WEBP or HEIC image.");
      return;
    }
    if (file.size > MAX_REQUEST_IMAGE_BYTES) {
      toast.error("Image is too large (max 10 MB).");
      return;
    }
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview(null);
    if (cameraInputRef.current) cameraInputRef.current.value = "";
    if (galleryInputRef.current) galleryInputRef.current.value = "";
  };

  const reverseGeocode = async (lat: number, lng: number): Promise<string | null> => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        { headers: { Accept: "application/json" } }
      );
      if (!res.ok) return null;
      const data = (await res.json()) as { display_name?: string };
      return data.display_name ?? null;
    } catch {
      return null;
    }
  };

  const handleUseMyLocation = () => {
    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      toast.error("Geolocation isn't supported on this device.");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const address = await reverseGeocode(latitude, longitude);
        setRequestForm((prev) => ({
          ...prev,
          latitude,
          longitude,
          location:
            address ?? `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
        }));
        toast.success("Location captured");
        setIsLocating(false);
      },
      (err) => {
        setIsLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          toast.error("Location permission denied. Enable it in your browser settings.");
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          toast.error("Couldn't determine your location. Try again outdoors.");
        } else if (err.code === err.TIMEOUT) {
          toast.error("Location request timed out. Please try again.");
        } else {
          toast.error("Failed to get your location.");
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 }
    );
  };

  const handleLocateOnMap = () => {
    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      toast.error("Geolocation isn't supported on this device.");
      return;
    }
    setIsLocatingMap(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserMapLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
        toast.success("Showing mechanics near you");
        setIsLocatingMap(false);
      },
      () => {
        setIsLocatingMap(false);
        toast.error("Unable to get your location for map search.");
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 }
    );
  };

  // Filter mechanics
  const filteredMechanics = useMemo(() => {
    const filtered = mechanics.filter((mechanic) => {
      const matchesSearch =
        searchQuery === "" ||
        mechanic.workshop_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        mechanic.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        mechanic.specialties.some((s) =>
          s.toLowerCase().includes(searchQuery.toLowerCase())
        );

      const matchesLocation =
        selectedLocation === "all" || mechanic.location === selectedLocation;

      const matchesSpecialty =
        selectedSpecialty === "all" ||
        mechanic.specialties.includes(selectedSpecialty);

      return matchesSearch && matchesLocation && matchesSpecialty;
    });

    if (!userMapLocation) return filtered;

    return [...filtered].sort((a, b) => {
      const aDistance = hasCoordinates(a)
        ? distanceInKm(
            userMapLocation.latitude,
            userMapLocation.longitude,
            a.latitude,
            a.longitude
          )
        : Number.POSITIVE_INFINITY;
      const bDistance = hasCoordinates(b)
        ? distanceInKm(
            userMapLocation.latitude,
            userMapLocation.longitude,
            b.latitude,
            b.longitude
          )
        : Number.POSITIVE_INFINITY;
      return aDistance - bDistance;
    });
  }, [
    mechanics,
    searchQuery,
    selectedLocation,
    selectedSpecialty,
    userMapLocation,
  ]);

  const mapMechanics = filteredMechanics.filter(hasCoordinates).map((m) => ({
    id: m.id,
    workshop_name: m.workshop_name,
    latitude: m.latitude,
    longitude: m.longitude,
  }));

  const selectedMapId =
    selectedMapMechanic &&
    mapMechanics.some((m) => m.id === selectedMapMechanic.id)
      ? selectedMapMechanic.id
      : mapMechanics[0]?.id ?? null;

  const handleRequestService = (mechanic: MechanicProfile) => {
    setSelectedMechanic(mechanic);
    resetRequestForm();
    setIsRequestModalOpen(true);
  };

  const handleSubmitRequest = async () => {
    if (!selectedMechanic || !requestForm.serviceType) {
      toast.error("Please select a service type");
      return;
    }
    if (!requestForm.location.trim() && requestForm.latitude == null) {
      toast.error("Please share your location");
      return;
    }

    setIsSubmitting(true);
    try {
      const supabase = createClient();

      let uploadedImageUrl: string | null = null;
      if (imageFile) {
        try {
          uploadedImageUrl = await uploadRequestImage(supabase, userId, imageFile);
        } catch (uploadError) {
          console.error("Image upload failed:", uploadError);
          toast.error("Failed to upload image. Please try a smaller photo.");
          setIsSubmitting(false);
          return;
        }
      }

      const { data, error } = await supabase
        .from("service_requests")
        .insert({
          client_id: userId,
          mechanic_id: selectedMechanic.id,
          service_type: requestForm.serviceType,
          description: requestForm.description,
          location: requestForm.location,
          latitude: requestForm.latitude,
          longitude: requestForm.longitude,
          image_url: uploadedImageUrl,
          status: "pending",
        })
        .select()
        .single();

      if (error) throw error;

      if (uploadedImageUrl) {
        const { error: messageError } = await supabase.from("messages").insert({
          request_id: data.id,
          sender_id: userId,
          content: "Photo attached to service request",
          message_type: "image",
          image_url: uploadedImageUrl,
        });

        if (messageError) throw messageError;
      }

      toast.success("Request sent successfully!");
      setIsRequestModalOpen(false);
      resetRequestForm();

      router.push(`/chat/${data.id}`);
    } catch (error) {
      console.error("Error creating request:", error);
      toast.error("Failed to send request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedLocation("all");
    setSelectedSpecialty("all");
  };

  const hasActiveFilters =
    searchQuery || selectedLocation !== "all" || selectedSpecialty !== "all";

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search mechanics, locations, or services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="gap-2"
          >
            <Filter className="h-4 w-4" />
            <span className="hidden sm:inline">Filters</span>
            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform",
                showFilters && "rotate-180"
              )}
            />
          </Button>
        </div>

        {showFilters && (
          <div className="flex flex-wrap gap-3 rounded-lg border border-border bg-card p-4">
            <div className="flex-1 min-w-[200px]">
              <Label className="mb-2 block text-sm">Location</Label>
              <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                <SelectTrigger>
                  <SelectValue placeholder="All Locations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  {LOCATIONS.map((location) => (
                    <SelectItem key={location} value={location}>
                      {location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <Label className="mb-2 block text-sm">Specialty</Label>
              <Select value={selectedSpecialty} onValueChange={setSelectedSpecialty}>
                <SelectTrigger>
                  <SelectValue placeholder="All Services" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Services</SelectItem>
                  {SPECIALTIES.map((specialty) => (
                    <SelectItem key={specialty} value={specialty}>
                      {specialty}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {hasActiveFilters && (
              <div className="flex items-end">
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="mr-1 h-4 w-4" />
                  Clear
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {filteredMechanics.length} mechanic
          {filteredMechanics.length !== 1 ? "s" : ""} found
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleLocateOnMap}
          disabled={isLocatingMap}
        >
          {isLocatingMap ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Navigation className="mr-2 h-4 w-4" />
          )}
          Near me
        </Button>
      </div>

      {/* Google Map */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <MechanicsMap
          mechanics={mapMechanics}
          userLocation={
            userMapLocation
              ? {
                  lat: userMapLocation.latitude,
                  lng: userMapLocation.longitude,
                }
              : null
          }
          selectedId={selectedMapId}
          onSelectMechanic={(id) => {
            const mechanic = filteredMechanics.find((m) => m.id === id);
            if (mechanic) setSelectedMapMechanic(mechanic);
          }}
          className="h-72"
        />
        {mapMechanics.length > 0 && (
          <div className="flex flex-wrap gap-2 border-t border-border p-3">
            {mapMechanics.slice(0, 8).map((mechanic) => (
              <Button
                key={mechanic.id}
                variant={mechanic.id === selectedMapId ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  const full = filteredMechanics.find((m) => m.id === mechanic.id);
                  if (full) setSelectedMapMechanic(full);
                }}
              >
                <MapPin className="mr-1 h-3.5 w-3.5" />
                {mechanic.workshop_name}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Mechanics Grid */}
      {filteredMechanics.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <Search className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold text-foreground">
            No mechanics found
          </h3>
          <p className="mt-2 text-muted-foreground">
            Try adjusting your search or filters
          </p>
          {hasActiveFilters && (
            <Button variant="outline" onClick={clearFilters} className="mt-4">
              Clear Filters
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredMechanics.map((mechanic) => (
            <div
              key={mechanic.id}
              className="group rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/50 hover:shadow-md"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <span className="text-xl font-bold text-primary">
                    {mechanic.workshop_name[0]}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="truncate font-semibold text-card-foreground">
                      {mechanic.workshop_name}
                    </h3>
                    {mechanic.verified && (
                      <CheckCircle className="h-4 w-4 shrink-0 text-success" />
                    )}
                  </div>
                  <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" />
                    <span className="truncate">
                      {mechanic.address || mechanic.location}
                    </span>
                  </div>
                  {userMapLocation &&
                    mechanic.latitude != null &&
                    mechanic.longitude != null && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {distanceInKm(
                          userMapLocation.latitude,
                          userMapLocation.longitude,
                          mechanic.latitude,
                          mechanic.longitude
                        ).toFixed(1)}{" "}
                        km away
                      </p>
                    )}
                  <div className="mt-2 flex items-center gap-3">
                    <span className="flex items-center gap-1 text-sm font-medium">
                      <Star className="h-4 w-4 fill-warning text-warning" />
                      {mechanic.rating?.toFixed(1) || "New"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      ({mechanic.total_reviews || 0} reviews)
                    </span>
                    {mechanic.is_available ? (
                      <Badge
                        variant="secondary"
                        className="bg-success/10 text-success"
                      >
                        Available
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Busy</Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Specialties */}
              <div className="mt-4 flex flex-wrap gap-1.5">
                {mechanic.specialties.slice(0, 3).map((specialty) => (
                  <Badge key={specialty} variant="outline" className="text-xs">
                    {specialty}
                  </Badge>
                ))}
                {mechanic.specialties.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{mechanic.specialties.length - 3}
                  </Badge>
                )}
              </div>

              {/* Experience */}
              <div className="mt-4 text-sm text-muted-foreground">
                {mechanic.years_experience} yrs exp
              </div>

              {/* Actions */}
              <div className="mt-4 flex gap-2">
                <Button
                  className="flex-1"
                  onClick={() => handleRequestService(mechanic)}
                  disabled={!mechanic.is_available}
                >
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Request Service
                </Button>
                {mechanic.phone && (
                  <Button variant="outline" size="icon" asChild>
                    <a href={`tel:${mechanic.phone}`}>
                      <Phone className="h-4 w-4" />
                    </a>
                  </Button>
                )}
                {mechanic.latitude != null && mechanic.longitude != null && (
                  <Button
                    variant="outline"
                    size="icon"
                    asChild
                    title="Open in Google Maps"
                  >
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${mechanic.latitude},${mechanic.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <MapPin className="h-4 w-4" />
                    </a>
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Request Service Modal */}
      <Dialog open={isRequestModalOpen} onOpenChange={setIsRequestModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Request Service</DialogTitle>
            <DialogDescription>
              Send a service request to {selectedMechanic?.workshop_name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Service Type</Label>
              <Select
                value={requestForm.serviceType}
                onValueChange={(value) =>
                  setRequestForm((prev) => ({ ...prev, serviceType: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select service type" />
                </SelectTrigger>
                <SelectContent>
                  {selectedMechanic?.specialties.map((specialty) => (
                    <SelectItem key={specialty} value={specialty}>
                      {specialty}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Your Location</Label>
              <Button
                type="button"
                variant="outline"
                className="w-full justify-start"
                onClick={handleUseMyLocation}
                disabled={isLocating}
              >
                {isLocating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <LocateFixed className="mr-2 h-4 w-4" />
                )}
                {requestForm.latitude != null
                  ? "Update my location"
                  : "Use my current location"}
              </Button>
              <Input
                placeholder="Address or landmark (e.g. near Shell, East Legon)"
                value={requestForm.location}
                onChange={(e) =>
                  setRequestForm((prev) => ({
                    ...prev,
                    location: e.target.value,
                  }))
                }
              />
              {requestForm.latitude != null && requestForm.longitude != null && (
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  GPS locked: {requestForm.latitude.toFixed(5)},{" "}
                  {requestForm.longitude.toFixed(5)}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Describe the Problem</Label>
              <Textarea
                placeholder="Tell the mechanic about your car issue..."
                value={requestForm.description}
                onChange={(e) =>
                  setRequestForm((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label>Add a Photo (optional)</Label>
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => handleImagePicked(e.target.files?.[0])}
              />
              <input
                ref={galleryInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleImagePicked(e.target.files?.[0])}
              />

              {imagePreview ? (
                <div className="relative overflow-hidden rounded-lg border border-border">
                  <Image
                    src={imagePreview}
                    alt="Selected problem photo"
                    width={640}
                    height={360}
                    unoptimized
                    className="h-48 w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-md bg-background/90 px-2 py-1 text-xs font-medium text-foreground shadow-sm hover:bg-background"
                  >
                    <Trash2 className="h-3 w-3" />
                    Remove
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => cameraInputRef.current?.click()}
                  >
                    <Camera className="mr-2 h-4 w-4" />
                    Snap Photo
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => galleryInputRef.current?.click()}
                  >
                    <ImagePlus className="mr-2 h-4 w-4" />
                    Upload
                  </Button>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Show the mechanic what's wrong — max 10 MB.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setIsRequestModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleSubmitRequest}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send Request"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
