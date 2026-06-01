import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ChatInterface } from "@/components/chat-interface";

interface ChatPageProps {
  params: Promise<{ requestId: string }>;
}

export default async function ChatPage({ params }: ChatPageProps) {
  const { requestId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Get the service request with related data
  const { data: request, error: requestError } = await supabase
    .from("service_requests")
    .select(
      `
      *,
      profiles:client_id(*),
      mechanic_profiles(*, profiles:user_id(*))
    `
    )
    .eq("id", requestId)
    .single();

  if (requestError || !request) {
    redirect("/dashboard");
  }

  // Get user's profile to determine role
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // Get initial messages
  const { data: messages } = await supabase
    .from("messages")
    .select("*, profiles:sender_id(*)")
    .eq("request_id", requestId)
    .order("created_at", { ascending: true });

  const { data: existingReview } = await supabase
    .from("reviews")
    .select("*")
    .eq("request_id", requestId)
    .maybeSingle();

  // Determine if user is client or mechanic in this chat
  const isClient = request.client_id === user.id;
  const otherParty = isClient
    ? request.mechanic_profiles?.profiles
    : request.profiles;
  const otherPartyName = isClient
    ? request.mechanic_profiles?.workshop_name
    : otherParty?.full_name;

  return (
    <ChatInterface
      requestId={requestId}
      request={request}
      currentUserId={user.id}
      currentUserName={profile?.full_name || "User"}
      otherPartyName={otherPartyName || "User"}
      initialMessages={messages || []}
      isClient={isClient}
      existingReview={existingReview}
    />
  );
}
