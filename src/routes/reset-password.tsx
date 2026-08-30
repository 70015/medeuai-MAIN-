import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/password-input";
import { BrandMark } from "@/components/brand-logo";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset password — MedEu.Ai" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [linkValid, setLinkValid] = useState<boolean | null>(null);

  // The recovery link puts either an error or a session in the URL.
  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    if (hash.get("error") || hash.get("error_description")) {
      setLinkValid(false);
      return;
    }
    supabase.auth.getSession().then(({ data }) => setLinkValid(!!data.session));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const { error: upErr } = await supabase.auth.updateUser({ password });
      if (upErr) throw upErr;
      toast.success("Password updated", { description: "You're signed in with your new password." });
      navigate({ to: "/dashboard", replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen bg-background hero-bg">
      <div className="container mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-4 py-12">
        <Link to="/" className="mb-8 flex items-center gap-2 font-semibold">
          <BrandMark className="h-10 w-10" />
          <span>
            MedEu<span className="text-primary">.Ai</span>
          </span>
        </Link>
        <Card className="w-full border-border/60 bg-card/70 p-6 backdrop-blur sm:p-8">
          {linkValid === false ? (
            <>
              <h1 className="text-2xl font-bold tracking-tight">Link expired</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                This password reset link is invalid or has expired. Request a new one to continue.
              </p>
              <Button asChild className="mt-6 w-full">
                <Link to="/auth" search={{ mode: "reset" }}>
                  Request a new link
                </Link>
              </Button>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold tracking-tight">Set a new password</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Enter a new password for your account.
              </p>
              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="password">New password</Label>
                  <PasswordInput
                    id="password"
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="confirm">Confirm new password</Label>
                  <PasswordInput
                    id="confirm"
                    minLength={8}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                    autoComplete="new-password"
                  />
                </div>
                {error && (
                  <p role="alert" className="text-sm font-medium text-destructive">
                    {error}
                  </p>
                )}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Update password
                </Button>
              </form>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
