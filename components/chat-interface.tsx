"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Navigation,
  Send,
  Image,
  MapPin,
  MoreVertical,
  Phone,
  CheckCircle,
  XCircle,
  Loader2,
  Mic,
  Square,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/client";
import {
  getVoiceNoteErrorMessage,
  MAX_VOICE_NOTE_BYTES,
  MAX_VOICE_NOTE_SECONDS,
  uploadChatAudio,
} from "@/lib/supabase/chat-media";
import { toast } from "sonner";
import { formatDistanceToNow, format } from "date-fns";
import { cn } from "@/lib/utils";
import { MechanicReviewForm } from "@/components/mechanic-review-form";
import { LiveTrackingMap } from "@/components/live-tracking-map";
import { useMechanicLocationTracking } from "@/hooks/use-mechanic-location-tracking";
import {
  getStatusLabel,
  getStatusBadgeClass,
  isClientAwaitingCompletion,
} from "@/lib/request-status";
import type { Message, Review, ServiceRequest, Profile } from "@/lib/types";

interface ChatInterfaceProps {
  requestId: string;
  request: ServiceRequest & {
    profiles: Profile;
    mechanic_profiles: { workshop_name: string; phone: string; profiles: Profile };
  };
  currentUserId: string;
  currentUserName: string;
  otherPartyName: string;
  initialMessages: (Message & { profiles: Profile })[];
  isClient: boolean;
  existingReview?: Review | null;
  showTracking?: boolean;
}

export function ChatInterface({
  requestId,
  request,
  currentUserId,
  currentUserName,
  otherPartyName,
  initialMessages,
  isClient,
  existingReview = null,
  showTracking = false,
}: ChatInterfaceProps) {
  const router = useRouter();
  const [messages, setMessages] = useState(initialMessages);
  const [review, setReview] = useState<Review | null>(existingReview);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [status, setStatus] = useState(request.status);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const recordingMimeTypeRef = useRef("");

  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isSendingAudio, setIsSendingAudio] = useState(false);

  const MAX_RECORDING_SECONDS = MAX_VOICE_NOTE_SECONDS;

  const stopMediaStream = useCallback(() => {
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    mediaStreamRef.current = null;
  }, []);

  const getSupportedAudioMimeType = () => {
    const types = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/mp4",
      "audio/ogg;codecs=opus",
    ];
    return types.find((type) => MediaRecorder.isTypeSupported(type)) ?? "";
  };

  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const clearRecordingTimer = useCallback(() => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      clearRecordingTimer();
      if (mediaRecorderRef.current?.state === "recording") {
        mediaRecorderRef.current.stop();
      }
      stopMediaStream();
    };
  }, [clearRecordingTimer, stopMediaStream]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Set up real-time subscription
  useEffect(() => {
    const supabase = createClient();

    // Subscribe to new messages
    const messagesChannel = supabase
      .channel(`messages:${requestId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `request_id=eq.${requestId}`,
        },
        async (payload) => {
          // Fetch the complete message with profile
          const { data } = await supabase
            .from("messages")
            .select("*, profiles:sender_id(*)")
            .eq("id", payload.new.id)
            .single();

          if (data) {
            setMessages((prev) => {
              // Avoid duplicates
              if (prev.some((m) => m.id === data.id)) return prev;
              return [...prev, data as Message & { profiles: Profile }];
            });
          }
        }
      )
      .subscribe();

    // Subscribe to request status changes
    const requestChannel = supabase
      .channel(`request:${requestId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "service_requests",
          filter: `id=eq.${requestId}`,
        },
        (payload) => {
          setStatus(payload.new.status);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(requestChannel);
    };
  }, [requestId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending) return;

    setIsSending(true);
    const messageContent = newMessage.trim();
    setNewMessage("");

    try {
      const supabase = createClient();
      const { error } = await supabase.from("messages").insert({
        request_id: requestId,
        sender_id: currentUserId,
        content: messageContent,
        message_type: "text",
      });

      if (error) throw error;
    } catch {
      toast.error("Failed to send message");
      setNewMessage(messageContent);
    } finally {
      setIsSending(false);
    }
  };

  const handleShareLocation = async () => {
    if (!("geolocation" in navigator)) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    try {
      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        }
      );

      const supabase = createClient();
      const { error } = await supabase.from("messages").insert({
        request_id: requestId,
        sender_id: currentUserId,
        content: "Shared location",
        message_type: "location",
        location_data: {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        },
      });

      if (error) throw error;
      toast.success("Location shared");
    } catch {
      toast.error("Failed to get location");
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // For now, we'll create a data URL (in production, upload to storage)
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const supabase = createClient();
        const { error } = await supabase.from("messages").insert({
          request_id: requestId,
          sender_id: currentUserId,
          content: "Sent an image",
          message_type: "image",
          image_url: reader.result as string,
        });

        if (error) throw error;
        toast.success("Image sent");
      } catch {
        toast.error("Failed to send image");
      }
    };
    reader.readAsDataURL(file);
  };

  const sendAudioMessage = async (blob: Blob, mimeType: string) => {
    setIsSendingAudio(true);
    try {
      if (blob.size > MAX_VOICE_NOTE_BYTES) {
        toast.error(
          `Voice note is too large (max ${Math.round(MAX_VOICE_NOTE_BYTES / 1024 / 1024)} MB). Try a shorter recording.`
        );
        return;
      }

      const supabase = createClient();
      const audioUrl = await uploadChatAudio(
        supabase,
        requestId,
        currentUserId,
        blob,
        mimeType
      );

      const { error } = await supabase.from("messages").insert({
        request_id: requestId,
        sender_id: currentUserId,
        content: "Voice note",
        message_type: "audio",
        audio_url: audioUrl,
      });

      if (error) throw error;
      toast.success("Voice note sent");
    } catch (error) {
      console.error("Voice note error:", error);
      toast.error(getVoiceNoteErrorMessage(error));
    } finally {
      setIsSendingAudio(false);
    }
  };

  const cancelRecording = useCallback(() => {
    clearRecordingTimer();
    setRecordingSeconds(0);
    setIsRecording(false);
    audioChunksRef.current = [];

    const recorder = mediaRecorderRef.current;
    if (recorder?.state === "recording") {
      recorder.onstop = () => {
        audioChunksRef.current = [];
        stopMediaStream();
        mediaRecorderRef.current = null;
      };
      recorder.stop();
    } else {
      stopMediaStream();
      mediaRecorderRef.current = null;
    }
  }, [clearRecordingTimer, stopMediaStream]);

  const stopRecording = useCallback(() => {
    clearRecordingTimer();
    setIsRecording(false);
    setRecordingSeconds(0);

    const recorder = mediaRecorderRef.current;
    if (recorder?.state === "recording") {
      recorder.stop();
    }
  }, [clearRecordingTimer]);

  useEffect(() => {
    if (isRecording && recordingSeconds >= MAX_RECORDING_SECONDS) {
      stopRecording();
      toast.message("Maximum recording length reached");
    }
  }, [isRecording, recordingSeconds, stopRecording]);

  const startRecording = async () => {
    if (isRecording || isSendingAudio) return;

    if (!navigator.mediaDevices?.getUserMedia) {
      toast.error("Audio recording is not supported in this browser");
      return;
    }

    const mimeType = getSupportedAudioMimeType();
    if (!mimeType) {
      toast.error("Audio recording is not supported in this browser");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      audioChunksRef.current = [];

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      recordingMimeTypeRef.current = mimeType;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const chunks = audioChunksRef.current;
        audioChunksRef.current = [];
        stopMediaStream();
        mediaRecorderRef.current = null;

        if (chunks.length === 0) return;

        const blob = new Blob(chunks, { type: mimeType });
        if (blob.size < 1000) {
          toast.error("Recording too short. Hold the mic and try again.");
          return;
        }

        await sendAudioMessage(blob, recordingMimeTypeRef.current);
      };

      recorder.start(250);
      setIsRecording(true);
      setRecordingSeconds(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch {
      stopMediaStream();
      toast.error("Microphone access denied. Allow mic permission and try again.");
    }
  };

  const handleStatusChange = async (
    newStatus: "in_progress" | "completed" | "cancelled"
  ) => {
    if (isClient && newStatus !== "cancelled") {
      toast.error("Only your mechanic can start or complete this service");
      return;
    }
    if (!isClient && newStatus === "cancelled") {
      toast.error("Only the client can cancel this service");
      return;
    }

    const canTransition =
      (status === "pending" && newStatus === "cancelled" && isClient) ||
      (status === "accepted" &&
        ((newStatus === "in_progress" && !isClient) ||
          (newStatus === "cancelled" && isClient))) ||
      (status === "in_progress" &&
        ((newStatus === "completed" && !isClient) ||
          (newStatus === "cancelled" && isClient)));

    if (!canTransition) {
      toast.error("This status change is not allowed");
      return;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("service_requests")
        .update({ status: newStatus })
        .eq("id", requestId);

      if (error) throw error;

      setStatus(newStatus);
      toast.success(
        newStatus === "completed"
          ? "Job marked as completed!"
          : newStatus === "in_progress"
          ? "Job started"
          : "Service cancelled"
      );
    } catch {
      toast.error("Failed to update status");
    }
  };

  const canClientCancel =
    isClient &&
    (status === "pending" || status === "accepted" || status === "in_progress");
  const canMechanicStart = !isClient && status === "accepted";
  const canMechanicComplete = !isClient && status === "in_progress";
  const hasStatusMenuActions =
    canClientCancel || canMechanicStart || canMechanicComplete;

  const isLiveTrackingActive =
    status === "accepted" || status === "in_progress";

  const clientLocation =
    request.latitude != null && request.longitude != null
      ? { lat: request.latitude, lng: request.longitude }
      : null;

  const { isSharing, error: trackingError } = useMechanicLocationTracking({
    requestId,
    enabled: !isClient && isLiveTrackingActive,
  });

  // Simulate typing indicator
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set typing indicator (in production, broadcast via realtime)
    setIsTyping(true);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 2000);
  };

  const getStatusBadge = () => (
    <Badge
      variant="secondary"
      className={getStatusBadgeClass(status, isClient)}
    >
      {getStatusLabel(status, isClient)}
    </Badge>
  );

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border bg-card px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon" className="shrink-0">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
                {otherPartyName[0]}
              </div>
              <div>
                <h1 className="font-semibold text-foreground">
                  {otherPartyName}
                </h1>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  {request.service_type}
                  {getStatusBadge()}
                  {isClient && isClientAwaitingCompletion(status) && (
                    <span>· Awaiting mechanic confirmation</span>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {request.mechanic_profiles?.phone && (
              <Button variant="ghost" size="icon" asChild>
                <a href={`tel:${request.mechanic_profiles.phone}`}>
                  <Phone className="h-5 w-5" />
                </a>
              </Button>
            )}
            {hasStatusMenuActions && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {canMechanicStart && (
                    <DropdownMenuItem
                      onClick={() => handleStatusChange("in_progress")}
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Start Job
                    </DropdownMenuItem>
                  )}
                  {canMechanicComplete && (
                    <DropdownMenuItem
                      onClick={() => handleStatusChange("completed")}
                    >
                      <CheckCircle className="mr-2 h-4 w-4 text-success" />
                      Mark Complete
                    </DropdownMenuItem>
                  )}
                  {canClientCancel && (
                    <DropdownMenuItem
                      onClick={() => handleStatusChange("cancelled")}
                      className="text-destructive"
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Cancel Service
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {/* Request Info */}
        <div className="mb-6 rounded-xl border border-border bg-card p-4 text-center">
          <p className="text-sm text-muted-foreground">
            Service request created{" "}
            {formatDistanceToNow(new Date(request.created_at), {
              addSuffix: true,
            })}
          </p>
          {request.description && (
            <p className="mt-2 text-sm text-foreground">
              {`"${request.description}"`}
            </p>
          )}
        </div>

        {showTracking && isLiveTrackingActive && isClient && (
          <div className="mb-6">
            <LiveTrackingMap
              requestId={requestId}
              clientLocation={clientLocation}
              mechanicName={otherPartyName}
              isTrackingActive={isLiveTrackingActive}
              className="h-56"
            />
          </div>
        )}

        {isLiveTrackingActive && !isClient && (
          <div
            className={cn(
              "mb-6 rounded-xl border px-4 py-3 text-sm",
              trackingError
                ? "border-destructive/40 bg-destructive/5 text-destructive"
                : "border-primary/30 bg-primary/5 text-foreground"
            )}
          >
            <div className="flex items-center gap-2 font-medium">
              <Navigation className="h-4 w-4 shrink-0" />
              {trackingError
                ? trackingError
                : isSharing
                  ? "Sharing your live location with the driver"
                  : "Getting your location…"}
            </div>
            {!trackingError && (
              <p className="mt-1 text-xs text-muted-foreground">
                Keep this page open while you travel to the breakdown site.
              </p>
            )}
          </div>
        )}

        {/* Message List */}
        <div className="space-y-4">
          {messages.map((message) => {
            const isOwnMessage = message.sender_id === currentUserId;
            return (
              <div
                key={message.id}
                className={cn(
                  "flex",
                  isOwnMessage ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-4 py-2",
                    isOwnMessage
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground"
                  )}
                >
                  {message.message_type === "text" && (
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  )}
                  {message.message_type === "image" && message.image_url && (
                    <img
                      src={message.image_url}
                      alt="Shared image"
                      className="max-h-64 rounded-lg"
                    />
                  )}
                  {message.message_type === "location" &&
                    message.location_data && (
                      <a
                        href={`https://www.google.com/maps?q=${message.location_data.latitude},${message.location_data.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 underline"
                      >
                        <MapPin className="h-4 w-4" />
                        View Location
                      </a>
                    )}
                  {message.message_type === "audio" && message.audio_url && (
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Voice note</p>
                      <audio
                        controls
                        preload="metadata"
                        src={message.audio_url}
                        className="h-10 w-full min-w-[220px] max-w-full"
                      />
                    </div>
                  )}
                  <p
                    className={cn(
                      "mt-1 text-xs",
                      isOwnMessage
                        ? "text-primary-foreground/70"
                        : "text-muted-foreground"
                    )}
                  >
                    {format(new Date(message.created_at), "HH:mm")}
                  </p>
                </div>
              </div>
            );
          })}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex justify-start">
              <div className="flex items-center gap-1 rounded-2xl bg-secondary px-4 py-3">
                <span className="typing-dot h-2 w-2 rounded-full bg-muted-foreground"></span>
                <span className="typing-dot h-2 w-2 rounded-full bg-muted-foreground"></span>
                <span className="typing-dot h-2 w-2 rounded-full bg-muted-foreground"></span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      {status !== "completed" && status !== "cancelled" && (
        <div className="border-t border-border bg-card p-4">
          {isRecording ? (
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={cancelRecording}
                aria-label="Cancel recording"
              >
                <X className="h-5 w-5" />
              </Button>
              <div className="flex flex-1 items-center gap-3 rounded-full bg-destructive/10 px-4 py-2">
                <span className="relative flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75" />
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-destructive" />
                </span>
                <span className="text-sm font-medium text-destructive">
                  Recording {formatRecordingTime(recordingSeconds)}
                </span>
              </div>
              <Button
                type="button"
                size="icon"
                onClick={stopRecording}
                aria-label="Send voice note"
                disabled={isSendingAudio}
              >
                {isSendingAudio ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Square className="h-5 w-5 fill-current" />
                )}
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                id="image-upload"
                onChange={handleImageUpload}
              />
              <label htmlFor="image-upload">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  asChild
                  disabled={isSendingAudio}
                >
                  <span>
                    <Image className="h-5 w-5" />
                  </span>
                </Button>
              </label>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleShareLocation}
                disabled={isSendingAudio}
              >
                <MapPin className="h-5 w-5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={startRecording}
                disabled={isSendingAudio}
                aria-label="Record voice note"
              >
                <Mic className="h-5 w-5" />
              </Button>
              <Input
                placeholder="Type a message..."
                value={newMessage}
                onChange={handleInputChange}
                className="flex-1"
                disabled={isSendingAudio}
              />
              <Button
                type="submit"
                size="icon"
                disabled={isSending || isSendingAudio || !newMessage.trim()}
              >
                {isSending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </Button>
            </form>
          )}
        </div>
      )}

      {/* Review + closed chat notice */}
      {(status === "completed" || status === "cancelled") && (
        <div className="border-t border-border bg-muted p-4 space-y-4">
          {isClient && status === "completed" && (
            <MechanicReviewForm
              mechanicId={request.mechanic_id}
              requestId={requestId}
              clientId={currentUserId}
              mechanicName={otherPartyName}
              existingReview={review}
              onSubmitted={setReview}
            />
          )}
          <p className="text-center text-sm text-muted-foreground">
            This conversation has been{" "}
            {status === "completed" ? "completed" : "cancelled"}
          </p>
        </div>
      )}
    </div>
  );
}
