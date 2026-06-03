"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Wrench,
  Clock,
  CheckCircle,
  XCircle,
  Star,
  AlertCircle,
  ChevronRight,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import type { MechanicProfile, Profile, ServiceRequest } from "@/lib/types";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

interface MechanicDashboardContentProps {
  userId: string;
  profile: Profile | null;
  mechanicProfile: MechanicProfile | null;
  requests: (ServiceRequest & { profiles: Profile })[];
}

export function MechanicDashboardContent({
  userId,
  profile,
  mechanicProfile,
  requests,
}: MechanicDashboardContentProps) {
  const router = useRouter();
  const [isAvailable, setIsAvailable] = useState(
    mechanicProfile?.is_available ?? true
  );
  const [isUpdating, setIsUpdating] = useState(false);

  const toggleAvailability = async () => {
    if (!mechanicProfile) return;
    setIsUpdating(true);

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("mechanic_profiles")
        .update({ is_available: !isAvailable })
        .eq("id", mechanicProfile.id);

      if (error) throw error;

      setIsAvailable(!isAvailable);
      toast.success(
        `You are now ${!isAvailable ? "available" : "unavailable"}`
      );
      router.refresh();
    } catch {
      toast.error("Failed to update availability");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRequestAction = async (
    requestId: string,
    action: "accepted" | "cancelled"
  ) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("service_requests")
        .update({ status: action })
        .eq("id", requestId);

      if (error) throw error;

      toast.success(
        action === "accepted" ? "Request accepted!" : "Request declined"
      );
      router.refresh();

      if (action === "accepted") {
        router.push(`/chat/${requestId}`);
      }
    } catch {
      toast.error("Failed to update request");
    }
  };

  // If no mechanic profile, show setup prompt
  if (!mechanicProfile) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
          <Wrench className="h-10 w-10 text-primary" />
        </div>
        <h2 className="mt-6 text-xl font-bold text-foreground">
          Complete Your Profile
        </h2>
        <p className="mt-2 max-w-md text-center text-muted-foreground">
          Set up your mechanic profile to start receiving service requests from
          clients in your area.
        </p>
        <Link href="/dashboard/mechanic/profile">
          <Button className="mt-6">
            Set Up Profile
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>
    );
  }

  const pendingRequests = requests.filter((r) => r.status === "pending");
  const completedRequests = requests.filter((r) => r.status === "completed");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {profile?.full_name || "Mechanic"}
          </p>
        </div>
        <Button
          variant={isAvailable ? "default" : "outline"}
          onClick={toggleAvailability}
          disabled={isUpdating}
          className="gap-2"
        >
          {isAvailable ? (
            <>
              <ToggleRight className="h-4 w-4" />
              Available
            </>
          ) : (
            <>
              <ToggleLeft className="h-4 w-4" />
              Unavailable
            </>
          )}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-warning/10">
              <Clock className="h-6 w-6 text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-2xl font-bold text-foreground">
                {pendingRequests.length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/10">
              <CheckCircle className="h-6 w-6 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Completed</p>
              <p className="text-2xl font-bold text-foreground">
                {completedRequests.length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10">
              <Star className="h-6 w-6 text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Rating</p>
              <p className="text-2xl font-bold text-foreground">
                {mechanicProfile.rating?.toFixed(1) || "New"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Requests */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-warning" />
            Pending Requests
          </CardTitle>
          {pendingRequests.length > 0 && (
            <Badge variant="secondary">{pendingRequests.length} new</Badge>
          )}
        </CardHeader>
        <CardContent>
          {pendingRequests.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No pending requests at the moment
            </div>
          ) : (
            <div className="space-y-4">
              {pendingRequests.map((request) => (
                <div
                  key={request.id}
                  className="flex flex-col gap-4 rounded-lg border border-border p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
                      {request.profiles?.full_name?.[0] || "C"}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        {request.profiles?.full_name || "Client"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {request.service_type} - {request.location}
                      </p>
                      {request.description && (
                        <p className="mt-1 text-sm text-muted-foreground line-clamp-1">
                          {request.description}
                        </p>
                      )}
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(request.created_at), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handleRequestAction(request.id, "cancelled")
                      }
                    >
                      <XCircle className="mr-1 h-4 w-4" />
                      Decline
                    </Button>
                    <Button
                      size="sm"
                      onClick={() =>
                        handleRequestAction(request.id, "accepted")
                      }
                    >
                      <CheckCircle className="mr-1 h-4 w-4" />
                      Accept
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
