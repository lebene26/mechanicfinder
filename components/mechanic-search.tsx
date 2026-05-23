"use client";

import { useState } from "react";
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
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import type { MechanicProfile } from "@/lib/types";
import { LOCATIONS, SPECIALTIES } from "@/lib/types";

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

  const [selectedMechanic, setSelectedMechanic] =
    useState<MechanicProfile | null>(null);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requestForm, setRequestForm] = useState({
    serviceType: "",
    description: "",
    location: "",
  });

  // Filter mechanics
  const filteredMechanics = mechanics.filter((mechanic) => {
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

  const handleRequestService = (mechanic: MechanicProfile) => {
    setSelectedMechanic(mechanic);
    setIsRequestModalOpen(true);
  };

  const handleSubmitRequest = async () => {
    if (!selectedMechanic || !requestForm.serviceType) {
      toast.error("Please select a service type");
      return;
    }

    setIsSubmitting(true);
    try {
      const supabase = createClient();

      const { data, error } = await supabase
        .from("service_requests")
        .insert({
          client_id: userId,
          mechanic_id: selectedMechanic.id,
          service_type: requestForm.serviceType,
          description: requestForm.description,
          location: requestForm.location,
          status: "pending",
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("Request sent successfully!");
      setIsRequestModalOpen(false);
      setRequestForm({ serviceType: "", description: "", location: "" });

      // Navigate to chat
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

              {/* Price & Experience */}
              <div className="mt-4 flex items-center justify-between text-sm">
                {mechanic.hourly_rate && (
                  <span className="font-medium text-foreground">
                    GH{"\u20B5"} {mechanic.hourly_rate}/hr
                  </span>
                )}
                <span className="text-muted-foreground">
                  {mechanic.years_experience} yrs exp
                </span>
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
              <Select
                value={requestForm.location}
                onValueChange={(value) =>
                  setRequestForm((prev) => ({ ...prev, location: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your location" />
                </SelectTrigger>
                <SelectContent>
                  {LOCATIONS.map((location) => (
                    <SelectItem key={location} value={location}>
                      {location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
