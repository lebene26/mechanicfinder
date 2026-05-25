"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Ban,
  CheckCircle2,
  Loader2,
  MoreHorizontal,
  Search,
  ShieldCheck,
  Trash2,
  UserCog,
  Users,
  Wrench,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Profile } from "@/lib/types";
import {
  deleteUser,
  suspendUser,
  unsuspendUser,
} from "@/app/admin/actions";

interface AdminDashboardProps {
  currentUserId: string;
  users: Profile[];
  stats: {
    total: number;
    clients: number;
    mechanics: number;
    admins: number;
    suspended: number;
    newThisWeek: number;
  };
}

type RoleFilter = "all" | "client" | "mechanic" | "admin";

type PendingAction = {
  type: "delete" | "suspend" | "unsuspend";
  user: Profile;
} | null;

export function AdminDashboardContent({
  currentUserId,
  users,
  stats,
}: AdminDashboardProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<RoleFilter>("all");
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [isPending, startTransition] = useTransition();
  const [busyUserId, setBusyUserId] = useState<string | null>(null);

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      if (activeTab !== "all" && u.role !== activeTab) return false;
      if (!q) return true;
      return (
        u.email?.toLowerCase().includes(q) ||
        u.full_name?.toLowerCase().includes(q) ||
        u.phone?.toLowerCase().includes(q)
      );
    });
  }, [users, activeTab, search]);

  const runAction = (action: PendingAction) => {
    if (!action) return;
    setBusyUserId(action.user.id);
    startTransition(async () => {
      try {
        let res;
        if (action.type === "delete") {
          res = await deleteUser(action.user.id);
        } else if (action.type === "suspend") {
          res = await suspendUser(action.user.id);
        } else {
          res = await unsuspendUser(action.user.id);
        }

        if ("error" in res) {
          toast.error(res.error);
        } else {
          toast.success(
            action.type === "delete"
              ? "User deleted"
              : action.type === "suspend"
                ? "User suspended"
                : "User reactivated"
          );
          router.refresh();
        }
      } finally {
        setBusyUserId(null);
        setPendingAction(null);
      }
    });
  };

  const statCards = [
    {
      label: "Total Users",
      value: stats.total,
      icon: Users,
      tone: "bg-primary/10 text-primary",
    },
    {
      label: "Drivers (Clients)",
      value: stats.clients,
      icon: UserCog,
      tone: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    },
    {
      label: "Mechanics",
      value: stats.mechanics,
      icon: Wrench,
      tone: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    },
    {
      label: "Suspended",
      value: stats.suspended,
      icon: Ban,
      tone: "bg-destructive/10 text-destructive",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
          Admin Dashboard
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage every driver and mechanic on the platform.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardContent className="flex items-center gap-3 p-4">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${stat.tone}`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs text-muted-foreground">
                    {stat.label}
                  </p>
                  <p className="text-xl font-bold text-foreground md:text-2xl">
                    {stat.value}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Administrators</p>
              <p className="text-lg font-semibold">{stats.admins}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">New This Week</p>
              <p className="text-lg font-semibold">{stats.newThisWeek}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="gap-3">
          <div className="flex flex-col items-start justify-between gap-3 md:flex-row md:items-center">
            <CardTitle>Registered Users</CardTitle>
            <div className="relative w-full md:w-72">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, email, phone"
                className="pl-9"
              />
            </div>
          </div>
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as RoleFilter)}
          >
            <TabsList>
              <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
              <TabsTrigger value="client">
                Drivers ({stats.clients})
              </TabsTrigger>
              <TabsTrigger value="mechanic">
                Mechanics ({stats.mechanics})
              </TabsTrigger>
              <TabsTrigger value="admin">Admins ({stats.admins})</TabsTrigger>
            </TabsList>
            <TabsContent value={activeTab} />
          </Tabs>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Phone</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Joined
                  </TableHead>
                  <TableHead className="w-[60px] text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="py-10 text-center text-sm text-muted-foreground"
                    >
                      No users match your filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => {
                    const isSelf = user.id === currentUserId;
                    const isBusy = busyUserId === user.id && isPending;
                    return (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                              {(user.full_name?.[0] || user.email?.[0] || "U")
                                .toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-foreground">
                                {user.full_name || "—"}
                                {isSelf && (
                                  <span className="ml-2 text-xs text-muted-foreground">
                                    (you)
                                  </span>
                                )}
                              </p>
                              <p className="truncate text-xs text-muted-foreground">
                                {user.email}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              user.role === "admin"
                                ? "default"
                                : user.role === "mechanic"
                                  ? "secondary"
                                  : "outline"
                            }
                            className="capitalize"
                          >
                            {user.role === "client" ? "driver" : user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {user.status === "suspended" ? (
                            <Badge variant="destructive">Suspended</Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="border-emerald-500/40 text-emerald-600 dark:text-emerald-400"
                            >
                              Active
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                          {user.phone || "—"}
                        </TableCell>
                        <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                          {new Date(user.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                disabled={isBusy || isSelf}
                              >
                                {isBusy ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <MoreHorizontal className="h-4 w-4" />
                                )}
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {user.status === "active" ? (
                                <DropdownMenuItem
                                  onClick={() =>
                                    setPendingAction({
                                      type: "suspend",
                                      user,
                                    })
                                  }
                                >
                                  <Ban className="mr-2 h-4 w-4" />
                                  Suspend user
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  onClick={() =>
                                    setPendingAction({
                                      type: "unsuspend",
                                      user,
                                    })
                                  }
                                >
                                  <CheckCircle2 className="mr-2 h-4 w-4" />
                                  Reactivate user
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                variant="destructive"
                                onClick={() =>
                                  setPendingAction({
                                    type: "delete",
                                    user,
                                  })
                                }
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete user
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <AlertDialog
        open={pendingAction !== null}
        onOpenChange={(open) => {
          if (!open && !isPending) setPendingAction(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingAction?.type === "delete"
                ? "Delete this user?"
                : pendingAction?.type === "suspend"
                  ? "Suspend this user?"
                  : "Reactivate this user?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingAction?.type === "delete"
                ? `This will permanently remove ${
                    pendingAction.user.full_name || pendingAction.user.email
                  } from the platform, including their profile and any related data. This action cannot be undone.`
                : pendingAction?.type === "suspend"
                  ? `${
                      pendingAction.user.full_name || pendingAction.user.email
                    } will be signed out and blocked from logging in until you reactivate them.`
                  : `${
                      pendingAction?.user.full_name ||
                      pendingAction?.user.email
                    } will be allowed to log in again.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                runAction(pendingAction);
              }}
              disabled={isPending}
              className={
                pendingAction?.type === "delete"
                  ? "bg-destructive text-white hover:bg-destructive/90"
                  : undefined
              }
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Working...
                </>
              ) : pendingAction?.type === "delete" ? (
                "Delete"
              ) : pendingAction?.type === "suspend" ? (
                "Suspend"
              ) : (
                "Reactivate"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
