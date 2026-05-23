import type { SupabaseClient } from "@supabase/supabase-js";

export const CHAT_MEDIA_BUCKET = "chat-media";
export const MAX_VOICE_NOTE_BYTES = 50 * 1024 * 1024; // 50 MB — must match Supabase bucket limit
export const MAX_VOICE_NOTE_SECONDS = 300; // 5 minutes

export function getAudioExtension(mimeType: string): string {
  if (mimeType.includes("mp4")) return "m4a";
  if (mimeType.includes("ogg")) return "ogg";
  return "webm";
}

export async function uploadChatAudio(
  supabase: SupabaseClient,
  requestId: string,
  userId: string,
  blob: Blob,
  mimeType: string
): Promise<string> {
  const ext = getAudioExtension(mimeType);
  const filePath = `${requestId}/${userId}/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(CHAT_MEDIA_BUCKET)
    .upload(filePath, blob, {
      contentType: mimeType,
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    throw uploadError;
  }

  const { data } = supabase.storage
    .from(CHAT_MEDIA_BUCKET)
    .getPublicUrl(filePath);

  return data.publicUrl;
}

export function getVoiceNoteErrorMessage(error: unknown): string {
  const message =
    error && typeof error === "object" && "message" in error
      ? String(error.message)
      : "Failed to send voice note";

  if (
    message.includes("Bucket not found") ||
    message.includes("chat-media")
  ) {
    return "Storage not set up. Run supabase/migrations/add_audio_messages.sql in Supabase.";
  }

  if (
    message.includes("audio_url") ||
    message.includes("message_type") ||
    message.includes("PGRST204") ||
    message.includes("23514")
  ) {
    return "Database not updated for voice notes. Run supabase/migrations/add_audio_messages.sql.";
  }

  if (message.includes("payload") || message.includes("too large")) {
    return "Voice note is too long. Try a shorter recording.";
  }

  return message;
}
