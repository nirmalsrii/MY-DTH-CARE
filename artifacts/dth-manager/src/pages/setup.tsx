import { useState } from "react";
import { useLocation } from "wouter";
import { useSetupAdmin } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Satellite, Lock, User, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function Setup() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const setup = useSetupAdmin();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);

  const handleSetup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      toast({ title: "Enter a username", variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }
    if (password !== confirm) {
      toast({ title: "Passwords do not match", variant: "destructive" });
      return;
    }
    setup.mutate(
      { data: { username, password } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
          toast({ title: "Account created! Welcome to DTH Manager." });
          setLocation("/");
        },
        onError: (err: any) => {
          const msg = err?.response?.data?.error ?? "Setup failed";
          toast({ title: msg, variant: "destructive" });
        },
      }
    );
  };

  return (
    <div className="min-h-screen bg-sidebar flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-sidebar-primary flex items-center justify-center mb-4 shadow-xl">
            <Satellite className="w-8 h-8 text-sidebar-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-sidebar-foreground">DTH Manager</h1>
          <p className="text-sm text-sidebar-foreground/50 mt-1">Sri Lanka Operations Portal</p>
        </div>

        {/* Setup Card */}
        <div className="bg-sidebar-accent rounded-xl p-8 shadow-2xl border border-sidebar-border">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-sidebar-foreground">First Time Setup</h2>
            <p className="text-sm text-sidebar-foreground/50 mt-1">Create your admin account to get started</p>
          </div>

          <form onSubmit={handleSetup} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-sidebar-foreground/70">Username</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sidebar-foreground/40" />
                <Input
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="Choose a username"
                  className="pl-9 bg-sidebar border-sidebar-border text-sidebar-foreground placeholder:text-sidebar-foreground/30"
                  data-testid="input-setup-username"
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sidebar-foreground/70">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sidebar-foreground/40" />
                <Input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  className="pl-9 pr-10 bg-sidebar border-sidebar-border text-sidebar-foreground placeholder:text-sidebar-foreground/30"
                  data-testid="input-setup-password"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-sidebar-foreground/40 hover:text-sidebar-foreground/70"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sidebar-foreground/70">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sidebar-foreground/40" />
                <Input
                  type={showPw ? "text" : "password"}
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder="Repeat password"
                  className="pl-9 bg-sidebar border-sidebar-border text-sidebar-foreground placeholder:text-sidebar-foreground/30"
                  data-testid="input-setup-confirm"
                  autoComplete="new-password"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-sidebar-primary text-sidebar-primary-foreground hover:opacity-90 font-semibold mt-2"
              disabled={setup.isPending}
              data-testid="button-setup-submit"
            >
              {setup.isPending ? "Creating account..." : "Create Admin Account"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
