"use client";

import Link from "next/link";
import { MessageCircle, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";

interface MessagesListProps {
  conversations: any[];
  isClient: boolean;
}

export function MessagesList({ conversations, isClient }: MessagesListProps) {
  if (conversations.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-12 text-center">
        <MessageCircle className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold text-foreground">
          No conversations yet
        </h3>
        <p className="mt-2 text-muted-foreground">
          {isClient
            ? "Request a mechanic to start chatting"
            : "Accept requests to start chatting with clients"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {conversations.map((conversation) => {
        const otherPartyName = isClient
          ? conversation.mechanic_profiles?.workshop_name
          : conversation.profiles?.full_name;

        const lastMessage =
          conversation.messages?.[conversation.messages.length - 1];
        const unreadCount = conversation.messages?.filter(
          (m: any) => !m.is_read && m.sender_id !== conversation.client_id
        ).length;

        return (
          <Link key={conversation.id} href={`/chat/${conversation.id}`}>
            <Card className="transition-all hover:border-primary/50 hover:shadow-md">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
                  {otherPartyName?.[0] || "U"}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="truncate font-semibold text-foreground">
                      {otherPartyName || "User"}
                    </h3>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {lastMessage &&
                        formatDistanceToNow(new Date(lastMessage.created_at), {
                          addSuffix: true,
                        })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm text-muted-foreground">
                      {lastMessage?.content || conversation.service_type}
                    </p>
                    <div className="flex items-center gap-2">
                      {unreadCount > 0 && (
                        <Badge className="h-5 w-5 rounded-full p-0 text-xs">
                          {unreadCount}
                        </Badge>
                      )}
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
