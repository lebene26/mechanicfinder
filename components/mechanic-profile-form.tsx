"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import type { MechanicProfile } from "@/lib/types";
import { LOCATIONS, SPECIALTIES } from "@/lib/types";

interface MechanicProfileFormProps {
  userId: string;
  existingProfile: MechanicProfile | null;
}

export function MechanicProfileForm({
  userId,
  existingProfile,
}: MechanicProfileFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    workshopName: existingProfile?.workshop_name || "",
    description: existingProfile?.description || "",
    location: existingProfile?.location || "",
    address: existingProfile?.address || "",
    phone: existingProfile?.phone || "",
    hourlyRate: existingProfile?.hourly_rate?.toString() || "",
    yearsExperience: existingProfile?.years_experience?.toString() || "",
    specialties: existingProfile?.specialties || [],
    isAvailable: existingProfile?.is_available ?? true,
  });

  const handleSpecialtyToggle = (specialty: string) => {
    setFormData((prev) => ({
      ...prev,
      specialties: prev.specialties.includes(specialty)
        ? prev.specialties.filter((s) => s !== specialty)
        : [...prev.specialties, specialty],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.workshopName || !formData.location) {
      toast.error("Please fill in workshop name and location");
      return;
    }

    if (formData.specialties.length === 0) {
      toast.error("Please select at least one specialty");
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();

      const profileData = {
        user_id: userId,
        workshop_name: formData.workshopName,
        description: formData.description || null,
        location: formData.location,
        address: formData.address || null,
        phone: formData.phone || null,
        hourly_rate: formData.hourlyRate ? parseFloat(formData.hourlyRate) : null,
        years_experience: formData.yearsExperience
          ? parseInt(formData.yearsExperience)
          : 0,
        specialties: formData.specialties,
        is_available: formData.isAvailable,
      };

      let error;

      if (existingProfile) {
        const result = await supabase
          .from("mechanic_profiles")
          .update(profileData)
          .eq("id", existingProfile.id);
        error = result.error;
      } else {
        const result = await supabase
          .from("mechanic_profiles")
          .insert(profileData);
        error = result.error;
      }

      if (error) throw error;

      toast.success(
        existingProfile
          ? "Profile updated successfully!"
          : "Profile created successfully!"
      );
      router.push("/dashboard/mechanic");
      router.refresh();
    } catch (error) {
      console.error("Error saving profile:", error);
      const message =
        error && typeof error === "object" && "message" in error
          ? String(error.message)
          : "Failed to save profile. Please try again.";
      toast.error(
        message.includes("mechanic_profiles")
          ? "Database not set up. Run supabase/schema.sql in your Supabase SQL Editor."
          : message
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5 text-primary" />
            Workshop Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="workshopName">Workshop Name *</Label>
            <Input
              id="workshopName"
              placeholder="e.g., Kofi Auto Works"
              value={formData.workshopName}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  workshopName: e.target.value,
                }))
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Tell clients about your services and experience..."
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              rows={3}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="location">City *</Label>
              <Select
                value={formData.location}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, location: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select city" />
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
              <Label htmlFor="address">Street Address</Label>
              <Input
                id="address"
                placeholder="e.g., Ring Road, East Legon"
                value={formData.address}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, address: e.target.value }))
                }
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+233 XX XXX XXXX"
                value={formData.phone}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, phone: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="yearsExperience">Years of Experience</Label>
              <Input
                id="yearsExperience"
                type="number"
                min="0"
                placeholder="e.g., 5"
                value={formData.yearsExperience}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    yearsExperience: e.target.value,
                  }))
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="hourlyRate">Hourly Rate (GH₵)</Label>
            <Input
              id="hourlyRate"
              type="number"
              min="0"
              step="0.01"
              placeholder="e.g., 50"
              value={formData.hourlyRate}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  hourlyRate: e.target.value,
                }))
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Specialties */}
      <Card>
        <CardHeader>
          <CardTitle>Services Offered *</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            {SPECIALTIES.map((specialty) => (
              <div key={specialty} className="flex items-center space-x-3">
                <Checkbox
                  id={specialty}
                  checked={formData.specialties.includes(specialty)}
                  onCheckedChange={() => handleSpecialtyToggle(specialty)}
                />
                <Label
                  htmlFor={specialty}
                  className="cursor-pointer text-sm font-normal"
                >
                  {specialty}
                </Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Availability */}
      <Card>
        <CardHeader>
          <CardTitle>Availability</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-3">
            <Checkbox
              id="isAvailable"
              checked={formData.isAvailable}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({
                  ...prev,
                  isAvailable: checked as boolean,
                }))
              }
            />
            <Label htmlFor="isAvailable" className="cursor-pointer">
              I am currently available to receive service requests
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Submit */}
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <Save className="mr-2 h-4 w-4" />
            {existingProfile ? "Update Profile" : "Create Profile"}
          </>
        )}
      </Button>
    </form>
  );
}
