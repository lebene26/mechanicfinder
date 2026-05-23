"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Wrench,
  Eye,
  EyeOff,
  Loader2,
  User,
  Phone,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Role = "client" | "mechanic";

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultRole = (searchParams.get("role") as Role) || null;

  const [step, setStep] = useState<"role" | "details">(
    defaultRole ? "details" : "role"
  );
  const [selectedRole, setSelectedRole] = useState<Role | null>(defaultRole);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
  });

  const handleRoleSelect = (role: Role) => {
    setSelectedRole(role);
    setStep("details");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) return;

    setIsLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo:
            process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ??
            `${window.location.origin}/auth/callback`,
          data: {
            full_name: formData.fullName,
            phone: formData.phone,
            role: selectedRole,
          },
        },
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success("Account created! Please check your email to verify.");
      router.push("/auth/signup-success");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-8">
      {/* Logo */}
      <div className="text-center">
        <Link href="/" className="inline-flex items-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
            <Wrench className="h-6 w-6 text-primary-foreground" />
          </div>
          <span className="text-2xl font-bold text-foreground">
            MechanicFinder
          </span>
        </Link>
        <h1 className="mt-6 text-2xl font-bold text-foreground">
          Create your account
        </h1>
        <p className="mt-2 text-muted-foreground">
          {step === "role"
            ? "Choose how you want to use MechanicFinder"
            : selectedRole === "client"
            ? "Sign up to find trusted mechanics"
            : "Sign up to offer your services"}
        </p>
      </div>

      {step === "role" ? (
        /* Role Selection */
        <div className="space-y-4">
          <button
            onClick={() => handleRoleSelect("client")}
            className={cn(
              "group flex w-full items-center gap-4 rounded-xl border-2 border-border bg-card p-6 text-left transition-all hover:border-primary hover:shadow-md",
              selectedRole === "client" && "border-primary bg-primary/5"
            )}
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/20">
              <User className="h-7 w-7 text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold text-foreground">
                  {"I'm a Client"}
                </span>
                {selectedRole === "client" && (
                  <Check className="h-5 w-5 text-primary" />
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                I need a mechanic for my vehicle
              </p>
            </div>
          </button>

          <button
            onClick={() => handleRoleSelect("mechanic")}
            className={cn(
              "group flex w-full items-center gap-4 rounded-xl border-2 border-border bg-card p-6 text-left transition-all hover:border-primary hover:shadow-md",
              selectedRole === "mechanic" && "border-primary bg-primary/5"
            )}
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/20">
              <Wrench className="h-7 w-7 text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold text-foreground">
                  {"I'm a Mechanic"}
                </span>
                {selectedRole === "mechanic" && (
                  <Check className="h-5 w-5 text-primary" />
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                I want to offer my services
              </p>
            </div>
          </button>
        </div>
      ) : (
        /* Sign Up Form */
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Role indicator */}
          <div className="flex items-center justify-between rounded-lg bg-secondary p-3">
            <div className="flex items-center gap-2">
              {selectedRole === "client" ? (
                <User className="h-4 w-4 text-secondary-foreground" />
              ) : (
                <Wrench className="h-4 w-4 text-secondary-foreground" />
              )}
              <span className="text-sm font-medium text-secondary-foreground">
                {selectedRole === "client"
                  ? "Signing up as Client"
                  : "Signing up as Mechanic"}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setStep("role")}
              className="text-sm text-primary hover:underline"
            >
              Change
            </button>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Your full name"
                required
                value={formData.fullName}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    fullName: e.target.value,
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                required
                value={formData.email}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, email: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+233 XX XXX XXXX"
                  className="pl-10"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, phone: e.target.value }))
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a strong password"
                  required
                  minLength={6}
                  value={formData.password}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      password: e.target.value,
                    }))
                  }
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Must be at least 6 characters
              </p>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating account...
              </>
            ) : (
              "Create account"
            )}
          </Button>
        </form>
      )}

      <div className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/auth/login"
          className="font-medium text-primary hover:underline"
        >
          Sign in
        </Link>
      </div>
    </div>
  );
}

function SignupFormFallback() {
  return (
    <div className="w-full max-w-md space-y-8">
      <div className="text-center">
        <div className="inline-flex items-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
            <Wrench className="h-6 w-6 text-primary-foreground" />
          </div>
          <span className="text-2xl font-bold text-foreground">
            MechanicFinder
          </span>
        </div>
        <h1 className="mt-6 text-2xl font-bold text-foreground">
          Create your account
        </h1>
        <p className="mt-2 text-muted-foreground">
          Choose how you want to use MechanicFinder
        </p>
      </div>
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-8">
      <Suspense fallback={<SignupFormFallback />}>
        <SignupForm />
      </Suspense>
    </div>
  );
}
