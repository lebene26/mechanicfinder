import Link from "next/link";
import { Wrench, Mail, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SignupSuccessPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8 text-center">
        {/* Logo */}
        <Link href="/" className="inline-flex items-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
            <Wrench className="h-6 w-6 text-primary-foreground" />
          </div>
          <span className="text-2xl font-bold text-foreground">
            MechanicFinder
          </span>
        </Link>

        {/* Success Icon */}
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-success/10">
          <CheckCircle2 className="h-10 w-10 text-success" />
        </div>

        {/* Message */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Check Your Email
          </h1>
          <p className="mt-3 text-muted-foreground">
            {"We've sent you a verification link. Please check your email and click the link to verify your account."}
          </p>
        </div>

        {/* Email Icon */}
        <div className="rounded-xl border border-border bg-card p-6">
          <Mail className="mx-auto h-12 w-12 text-primary" />
          <p className="mt-4 text-sm text-muted-foreground">
            {"Didn't receive the email? Check your spam folder or try signing up again."}
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Link href="/auth/login">
            <Button className="w-full">Go to Login</Button>
          </Link>
          <Link href="/">
            <Button variant="ghost" className="w-full">
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
