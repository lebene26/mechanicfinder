import Link from "next/link";
import { Wrench, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AuthErrorPage() {
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

        {/* Error Icon */}
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
          <AlertCircle className="h-10 w-10 text-destructive" />
        </div>

        {/* Message */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Authentication Error
          </h1>
          <p className="mt-3 text-muted-foreground">
            Something went wrong during authentication. This might happen if the
            link has expired or has already been used.
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Link href="/auth/login">
            <Button className="w-full">Try Again</Button>
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
