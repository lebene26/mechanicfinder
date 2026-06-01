"use client";

import { useState } from "react";
import { Star, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { getReviewErrorMessage } from "@/lib/reviews";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Review } from "@/lib/types";

interface MechanicReviewFormProps {
  mechanicId: string;
  requestId: string;
  clientId: string;
  mechanicName: string;
  existingReview?: Review | null;
  onSubmitted?: (review: Review) => void;
  className?: string;
}

export function MechanicReviewForm({
  mechanicId,
  requestId,
  clientId,
  mechanicName,
  existingReview,
  onSubmitted,
  className,
}: MechanicReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedReview, setSubmittedReview] = useState<Review | null>(
    existingReview ?? null
  );

  const displayRating = submittedReview?.rating ?? rating;
  const isReadOnly = Boolean(submittedReview);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating < 1) {
      toast.error("Please select a star rating");
      return;
    }

    setIsSubmitting(true);
    try {
      const supabase = createClient();
      const commentValue = comment.trim() || null;

      let review: Review | null = null;

      const { data: rpcData, error: rpcError } = await supabase.rpc(
        "submit_service_review",
        {
          p_request_id: requestId,
          p_rating: rating,
          p_comment: commentValue,
        }
      );

      if (rpcError) {
        const rpcMissing =
          rpcError.code === "PGRST202" ||
          rpcError.message?.includes("submit_service_review");

        if (!rpcMissing) {
          throw rpcError;
        }

        const { data: insertData, error: insertError } = await supabase
          .from("reviews")
          .insert({
            mechanic_id: mechanicId,
            client_id: clientId,
            request_id: requestId,
            rating,
            comment: commentValue,
          })
          .select()
          .single();

        if (insertError) throw insertError;
        review = insertData as Review;
      } else {
        review = rpcData as Review;
      }

      if (!review) {
        throw new Error("No review returned");
      }

      setSubmittedReview(review);
      onSubmitted?.(review);
      toast.success("Thanks for your review!");
    } catch (error) {
      console.error("Review submit error:", error);
      toast.error(getReviewErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submittedReview) {
    return (
      <div
        className={cn(
          "rounded-xl border border-border bg-card p-4 text-center",
          className
        )}
      >
        <p className="text-sm font-medium text-foreground">
          You rated {mechanicName} for this service
        </p>
        <div className="mt-2 flex justify-center gap-1">
          {Array.from({ length: 5 }).map((_, index) => (
            <Star
              key={index}
              className={cn(
                "h-5 w-5",
                index < submittedReview.rating
                  ? "fill-warning text-warning"
                  : "text-muted-foreground"
              )}
            />
          ))}
        </div>
        {submittedReview.comment && (
          <p className="mt-3 text-sm text-muted-foreground">
            &ldquo;{submittedReview.comment}&rdquo;
          </p>
        )}
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        "rounded-xl border border-border bg-card p-4 space-y-4",
        className
      )}
    >
      <div className="text-center">
        <p className="text-sm font-medium text-foreground">
          How was this service with {mechanicName}?
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          One rating per completed job — you can rate again after your next
          service
        </p>
      </div>

      <div className="flex justify-center gap-1">
        {Array.from({ length: 5 }).map((_, index) => {
          const starValue = index + 1;
          const active = starValue <= (hoverRating || displayRating);

          return (
            <button
              key={starValue}
              type="button"
              className="rounded p-1 transition-transform hover:scale-110"
              onClick={() => setRating(starValue)}
              onMouseEnter={() => setHoverRating(starValue)}
              onMouseLeave={() => setHoverRating(0)}
              aria-label={`Rate ${starValue} stars`}
            >
              <Star
                className={cn(
                  "h-8 w-8",
                  active ? "fill-warning text-warning" : "text-muted-foreground"
                )}
              />
            </button>
          );
        })}
      </div>

      <div className="space-y-2">
        <Label htmlFor={`review-comment-${requestId}`}>
          Comment (optional)
        </Label>
        <Textarea
          id={`review-comment-${requestId}`}
          placeholder="Share details about your experience..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          maxLength={500}
          disabled={isReadOnly}
        />
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={isSubmitting || rating < 1}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Submitting...
          </>
        ) : (
          "Submit review"
        )}
      </Button>
    </form>
  );
}
