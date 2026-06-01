import type { ServiceRequest } from "@/lib/types";

export type ServiceRequestStatus = ServiceRequest["status"];

/** Driver view: pending until mechanic confirms completion. */
export type ClientDisplayStatus = "pending" | "completed" | "cancelled";

export function getClientDisplayStatus(
  status: ServiceRequestStatus
): ClientDisplayStatus {
  if (status === "completed") return "completed";
  if (status === "cancelled") return "cancelled";
  return "pending";
}

export function isClientAwaitingCompletion(status: ServiceRequestStatus): boolean {
  return status === "accepted" || status === "in_progress";
}

export function getStatusLabel(
  status: ServiceRequestStatus,
  isClient: boolean
): string {
  if (isClient) {
    switch (getClientDisplayStatus(status)) {
      case "pending":
        return "Pending";
      case "completed":
        return "Completed";
      case "cancelled":
        return "Cancelled";
    }
  }

  switch (status) {
    case "pending":
      return "Pending";
    case "accepted":
      return "Accepted";
    case "in_progress":
      return "In Progress";
    case "completed":
      return "Completed";
    case "cancelled":
      return "Cancelled";
  }
}

export function getStatusBadgeClass(
  status: ServiceRequestStatus,
  isClient: boolean
): string {
  const display = isClient ? getClientDisplayStatus(status) : status;

  switch (display) {
    case "pending":
      return "bg-warning/10 text-warning";
    case "accepted":
    case "in_progress":
      return "bg-primary/10 text-primary";
    case "completed":
      return "bg-success/10 text-success";
    case "cancelled":
      return "bg-destructive/10 text-destructive";
    default:
      return "";
  }
}
