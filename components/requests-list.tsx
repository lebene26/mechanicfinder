"use client";

import Link from "next/link";
import { Clock, CheckCircle, XCircle, MessageCircle, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import type { ServiceRequest, MechanicProfile, Profile } from "@/lib/types";

interface RequestsListProps {
  requests: (ServiceRequest & {
    mechanic_profiles?: MechanicProfile & { profiles: Profile };
    profiles?: Profile;
  })[];
  isClient: boolean;
}

export function RequestsList({ requests, isClient }: RequestsListProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4 text-warning" />;
      case "accepted":
      case "in_progress":
        return <Wrench className="h-4 w-4 text-primary" />;
      case "completed":
        return <CheckCircle className="h-4 w-4 text-success" />;
      case "cancelled":
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="secondary" className="bg-warning/10 text-warning">
            Pending
          </Badge>
        );
      case "accepted":
        return (
          <Badge variant="secondary" className="bg-primary/10 text-primary">
            Accepted
          </Badge>
        );
      case "in_progress":
        return (
          <Badge variant="secondary" className="bg-primary/10 text-primary">
            In Progress
          </Badge>
        );
      case "completed":
        return (
          <Badge variant="secondary" className="bg-success/10 text-success">
            Completed
          </Badge>
        );
      case "cancelled":
        return (
          <Badge
            variant="secondary"
            className="bg-destructive/10 text-destructive"
          >
            Cancelled
          </Badge>
        );
      default:
        return null;
    }
  };

  if (requests.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-12 text-center">
        <Clock className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold text-foreground">
          No requests yet
        </h3>
        <p className="mt-2 text-muted-foreground">
          {isClient
            ? "Your service requests will appear here"
            : "Incoming requests will appear here"}
        </p>
        {isClient && (
          <Link href="/dashboard/client">
            <Button className="mt-4">Find a Mechanic</Button>
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {requests.map((request) => {
        const otherParty = isClient
          ? request.mechanic_profiles
          : { profiles: request.profiles };
        const otherPartyName = isClient
          ? request.mechanic_profiles?.workshop_name
          : request.profiles?.full_name;

        return (
          <Card key={request.id}>
            <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  {getStatusIcon(request.status)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-foreground">
                      {otherPartyName || "User"}
                    </h3>
                    {getStatusBadge(request.status)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {request.service_type}
                    {request.location && ` - ${request.location}`}
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
              <div className="flex gap-2 sm:flex-col">
                {request.status !== "cancelled" &&
                  request.status !== "completed" && (
                    <Link href={`/chat/${request.id}`} className="flex-1 sm:flex-none">
                      <Button className="w-full" size="sm">
                        <MessageCircle className="mr-2 h-4 w-4" />
                        Open Chat
                      </Button>
                    </Link>
                  )}
                {(request.status === "completed" ||
                  request.status === "cancelled") && (
                  <Link href={`/chat/${request.id}`} className="flex-1 sm:flex-none">
                    <Button variant="outline" className="w-full" size="sm">
                      View History
                    </Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
