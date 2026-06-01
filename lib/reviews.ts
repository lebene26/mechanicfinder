export function getReviewErrorMessage(error: unknown): string {
  if (!error || typeof error !== "object") {
    return "Could not submit review. Please try again.";
  }

  const err = error as {
    code?: string;
    message?: string;
    details?: string;
    hint?: string;
  };

  const message = err.message ?? "";

  if (err.code === "23505" || message.includes("already reviewed")) {
    return "You already reviewed this service.";
  }

  if (
    err.code === "42501" ||
    message.toLowerCase().includes("row-level security")
  ) {
    return "You can only review after the mechanic marks the job complete.";
  }

  if (err.code === "PGRST116") {
    return "Review may have been saved. Refresh the page to confirm.";
  }

  if (message.includes("marks the job complete")) {
    return message;
  }

  if (message.includes("Only the client")) {
    return message;
  }

  if (message) {
    return message;
  }

  return "Could not submit review. Please try again.";
}
