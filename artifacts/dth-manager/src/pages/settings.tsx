import { useState } from "react";
import { useExchangeRate } from "@/hooks/use-exchange-rate";
import { useChangePassword } from "@workspace/api-client-react";
import { Settings2, DollarSign, Info, Shield, Key, Eye, EyeOff } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { ProviderBadge } from "@/components/ui/provider-badge";

const PROVIDERS = [
  { id: "tata_play", validity: 30 },
  { id: "airtel", validity: 30 },
  { id: "dish_tv", validity: 30 },
  { id: "sun_direct", validity: 30 },
  { id: "d2h", validity: 30 },
  { id: "zing", validity: 28 },
  { id: "dd_freedish", validity: 365 },
];

export default function Settings() {
  const { rate, setRate } = useExchangeRate();
  const { toast } = useToast();
  const [rateInput, setRateInput] = useState(String(rate));

  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const changePassword = useChangePassword();

  const handleSaveRate = () => {
    const val = parseFloat(rateInput);
    if (isNaN(val) || val <= 0) {
      toast({ title: "Invalid exchange rate", variant: "destructive" });
      return;
    }
    setRate(val);
    toast({ title: "Exchange rate updated", description: `1 INR = ${val} LKR` });
  };

  const handleChangePassword = () => {
    if (!currentPw) {
      toast({ title: "Enter your current password", variant: "destructive" });
      return;
    }
    if (newPw.length < 6) {
      toast({ title: "New password must be at least 6 characters", variant: "destructive" });
      return;
    }
    if (newPw !== confirmPw) {
      toast({ title: "Passwords do not match", variant: "destructive" });
      return;
    }
    changePassword.mutate(
      { data: { currentPassword: currentPw, newPassword: newPw } },
      {
        onSuccess: () => {
          toast({ title: "Password changed successfully" });
          setCurrentPw("");
          setNewPw("");
          setConfirmPw("");
        },
        onError: (err: any) => {
          const msg = err?.response?.data?.error ?? "Failed to change password";
          toast({ title: msg, variant: "destructive" });
        },
      }
    );
  };

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Settings2 className="w-6 h-6" />
          Settings
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">Configure your DTH Manager preferences</p>
      </div>

      {/* Exchange Rate */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-primary" />
            Currency Exchange Rate
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Set the INR to LKR conversion rate used for cost calculations and profit display.
          </p>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">1 INR =</span>
              <Input
                type="number"
                step="0.01"
                value={rateInput}
                onChange={e => setRateInput(e.target.value)}
                className="w-28"
                data-testid="input-exchange-rate"
              />
              <span className="text-sm font-medium">LKR</span>
            </div>
            <Button onClick={handleSaveRate} size="sm" data-testid="button-save-rate">Save</Button>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 text-sm">
            <p className="font-medium text-muted-foreground">Current rate: 1 INR = {rate} LKR</p>
            <p className="text-xs text-muted-foreground mt-0.5">Example: ₹500 = Rs. {(500 * rate).toFixed(2)}</p>
          </div>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Key className="w-4 h-4 text-primary" />
            Change Password
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">Update your admin login password.</p>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Current Password</Label>
              <div className="relative">
                <Input
                  type={showPw ? "text" : "password"}
                  value={currentPw}
                  onChange={e => setCurrentPw(e.target.value)}
                  placeholder="Enter current password"
                  data-testid="input-current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>New Password</Label>
              <Input
                type={showPw ? "text" : "password"}
                value={newPw}
                onChange={e => setNewPw(e.target.value)}
                placeholder="Min. 6 characters"
                data-testid="input-new-password"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Confirm New Password</Label>
              <Input
                type={showPw ? "text" : "password"}
                value={confirmPw}
                onChange={e => setConfirmPw(e.target.value)}
                placeholder="Repeat new password"
                data-testid="input-confirm-password"
              />
            </div>
            <Button
              onClick={handleChangePassword}
              disabled={changePassword.isPending}
              className="w-full"
              data-testid="button-change-password"
            >
              {changePassword.isPending ? "Changing..." : "Change Password"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* SMS */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Info className="w-4 h-4 text-primary" />
            SMS Gateway
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            SMS notifications are sent after recharges when the "Send SMS" toggle is enabled. Configure via environment variables on the server.
          </p>
          <div className="bg-muted/50 rounded-lg p-3 text-xs space-y-1 font-mono">
            <p><span className="text-muted-foreground">SMS_GATEWAY_URL</span> — Your SMS provider API endpoint</p>
            <p><span className="text-muted-foreground">SMS_API_KEY</span> — API authentication key</p>
            <p><span className="text-muted-foreground">SMS_SENDER_ID</span> — Sender ID (default: DTHSVC)</p>
          </div>
          <p className="text-xs text-muted-foreground">When no gateway is configured, SMS messages are logged to the server console (simulated mode).</p>
        </CardContent>
      </Card>

      {/* Providers */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">DTH Providers Reference</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {PROVIDERS.map(p => (
              <div key={p.id} className="flex items-center justify-between p-2 rounded border bg-muted/20">
                <ProviderBadge provider={p.id} />
                <span className="text-xs text-muted-foreground">{p.validity}d</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
