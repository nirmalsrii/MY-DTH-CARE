import { useState, useEffect } from "react";
import { useExchangeRate } from "@/hooks/use-exchange-rate";
import {
  useChangePassword,
  useGetAppSettings,
  useUpdateSmsSettings,
  useTestSmsGateway,
  useUpdateFirebaseAuthSettings,
  useUpdateFirebaseDbSettings,
  useTestFirebaseDb,
} from "@workspace/api-client-react";
import {
  Settings2, DollarSign, Info, Shield, Key, Eye, EyeOff,
  Wifi, WifiOff, MessageSquare, Database, CheckCircle2, XCircle, Loader2, Send,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ProviderBadge } from "@/components/ui/provider-badge";
import { Badge } from "@/components/ui/badge";

const PROVIDERS = [
  { id: "tata_play", validity: 30 },
  { id: "airtel", validity: 30 },
  { id: "dish_tv", validity: 30 },
  { id: "sun_direct", validity: 30 },
  { id: "d2h", validity: 30 },
  { id: "zing", validity: 28 },
  { id: "dd_freedish", validity: 365 },
];

function StatusBadge({ enabled, configured }: { enabled: boolean; configured: boolean }) {
  if (!configured)
    return (
      <Badge variant="secondary" className="text-xs gap-1">
        <XCircle className="w-3 h-3" /> Not Configured
      </Badge>
    );
  if (enabled)
    return (
      <Badge className="text-xs gap-1 bg-green-600 hover:bg-green-600">
        <CheckCircle2 className="w-3 h-3" /> Active
      </Badge>
    );
  return (
    <Badge variant="outline" className="text-xs gap-1">
      <WifiOff className="w-3 h-3" /> Disabled
    </Badge>
  );
}

export default function Settings() {
  const { rate, setRate } = useExchangeRate();
  const { toast } = useToast();
  const [rateInput, setRateInput] = useState(String(rate));

  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const changePassword = useChangePassword();

  const { data: appSettings, isLoading: settingsLoading } = useGetAppSettings();

  // SMS State
  const [smsGatewayUrl, setSmsGatewayUrl] = useState("");
  const [smsApiKey, setSmsApiKey] = useState("");
  const [smsSenderId, setSmsSenderId] = useState("ASIANDTH");
  const [smsEnabled, setSmsEnabled] = useState(false);
  const updateSms = useUpdateSmsSettings();
  const testSms = useTestSmsGateway();

  // Firebase Auth State
  const [fbAuthApiKey, setFbAuthApiKey] = useState("");
  const [fbAuthDomain, setFbAuthDomain] = useState("");
  const [fbProjectId, setFbProjectId] = useState("");
  const [fbAppId, setFbAppId] = useState("");
  const [fbAuthEnabled, setFbAuthEnabled] = useState(false);
  const updateFbAuth = useUpdateFirebaseAuthSettings();

  // Firebase DB State
  const [fbDbProjectId, setFbDbProjectId] = useState("");
  const [fbDbUrl, setFbDbUrl] = useState("");
  const [fbDbServiceJson, setFbDbServiceJson] = useState("");
  const [fbDbEnabled, setFbDbEnabled] = useState(false);
  const updateFbDb = useUpdateFirebaseDbSettings();
  const testFbDb = useTestFirebaseDb();

  // Populate forms when settings load
  useEffect(() => {
    if (!appSettings) return;
    const s = appSettings.sms;
    setSmsGatewayUrl(s.gatewayUrl ?? "");
    setSmsApiKey(s.apiKey ?? "");
    setSmsSenderId(s.senderId ?? "ASIANDTH");
    setSmsEnabled(s.enabled ?? false);

    const fa = appSettings.firebaseAuth;
    setFbAuthApiKey(fa.apiKey ?? "");
    setFbAuthDomain(fa.authDomain ?? "");
    setFbProjectId(fa.projectId ?? "");
    setFbAppId(fa.appId ?? "");
    setFbAuthEnabled(fa.enabled ?? false);

    const fd = appSettings.firebaseDb;
    setFbDbProjectId(fd.projectId ?? "");
    setFbDbUrl(fd.databaseUrl ?? "");
    setFbDbServiceJson(fd.serviceAccountJson === "••••••••" ? "" : (fd.serviceAccountJson ?? ""));
    setFbDbEnabled(fd.enabled ?? false);
  }, [appSettings]);

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
          setCurrentPw(""); setNewPw(""); setConfirmPw("");
        },
        onError: (err: any) => {
          const msg = err?.response?.data?.error ?? "Failed to change password";
          toast({ title: msg, variant: "destructive" });
        },
      }
    );
  };

  const handleSaveSms = () => {
    if (!smsGatewayUrl) {
      toast({ title: "Gateway URL is required", variant: "destructive" });
      return;
    }
    updateSms.mutate(
      { data: { gatewayUrl: smsGatewayUrl, apiKey: smsApiKey, senderId: smsSenderId, enabled: smsEnabled } },
      {
        onSuccess: () => toast({ title: "SMS gateway settings saved" }),
        onError: () => toast({ title: "Failed to save SMS settings", variant: "destructive" }),
      }
    );
  };

  const handleTestSms = () => {
    testSms.mutate(undefined, {
      onSuccess: () => toast({ title: "Test SMS sent!", description: "Check your SMS gateway logs." }),
      onError: (err: any) => {
        const msg = err?.response?.data?.error ?? "Test failed";
        toast({ title: msg, variant: "destructive" });
      },
    });
  };

  const handleSaveFbAuth = () => {
    if (fbAuthEnabled && !fbProjectId) {
      toast({ title: "Project ID is required to enable Firebase Auth", variant: "destructive" });
      return;
    }
    updateFbAuth.mutate(
      { data: { apiKey: fbAuthApiKey, authDomain: fbAuthDomain, projectId: fbProjectId, appId: fbAppId, enabled: fbAuthEnabled } },
      {
        onSuccess: () => toast({ title: "Firebase Auth settings saved" }),
        onError: () => toast({ title: "Failed to save Firebase Auth settings", variant: "destructive" }),
      }
    );
  };

  const handleSaveFbDb = () => {
    if (fbDbEnabled && !fbDbProjectId) {
      toast({ title: "Project ID is required to enable Firebase Database", variant: "destructive" });
      return;
    }
    updateFbDb.mutate(
      { data: { projectId: fbDbProjectId, databaseUrl: fbDbUrl, serviceAccountJson: fbDbServiceJson, enabled: fbDbEnabled } },
      {
        onSuccess: () => toast({ title: "Firebase Database settings saved" }),
        onError: () => toast({ title: "Failed to save Firebase DB settings", variant: "destructive" }),
      }
    );
  };

  const handleTestFbDb = () => {
    testFbDb.mutate(undefined, {
      onSuccess: (data: any) => toast({ title: "Connection valid!", description: data?.message }),
      onError: (err: any) => {
        const msg = err?.response?.data?.error ?? "Connection test failed";
        toast({ title: msg, variant: "destructive" });
      },
    });
  };

  const smsConfigured = !!(appSettings?.sms?.gatewayUrl);
  const fbAuthConfigured = !!(appSettings?.firebaseAuth?.projectId);
  const fbDbConfigured = !!(appSettings?.firebaseDb?.projectId);

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Settings2 className="w-6 h-6" />
          Settings
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">Configure your DTH Manager preferences and integrations</p>
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

      {/* SMS Gateway */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-primary" />
              SMS Gateway
            </CardTitle>
            <StatusBadge enabled={appSettings?.sms?.enabled ?? false} configured={smsConfigured} />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {settingsLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading...
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Configure your SMS gateway. SMS messages are sent after recharges when the "Send SMS" toggle is enabled.
              </p>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label>Gateway URL</Label>
                  <Input
                    value={smsGatewayUrl}
                    onChange={e => setSmsGatewayUrl(e.target.value)}
                    placeholder="https://api.yoursmsprovider.com/send"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>API Key</Label>
                  <Input
                    value={smsApiKey}
                    onChange={e => setSmsApiKey(e.target.value)}
                    placeholder={smsConfigured && appSettings?.sms?.apiKey?.includes("••") ? "••••••••  (leave blank to keep current)" : "Your SMS provider API key"}
                    type="password"
                  />
                  {smsConfigured && appSettings?.sms?.apiKey?.includes("••") && (
                    <p className="text-xs text-muted-foreground">API key is saved. Enter a new value to replace it.</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label>Sender ID</Label>
                  <Input
                    value={smsSenderId}
                    onChange={e => setSmsSenderId(e.target.value)}
                    placeholder="ASIANDTH"
                    maxLength={11}
                  />
                  <p className="text-xs text-muted-foreground">Alphanumeric, max 11 characters</p>
                </div>
                <div className="flex items-center gap-3 py-1">
                  <Switch
                    checked={smsEnabled}
                    onCheckedChange={setSmsEnabled}
                    id="sms-enabled"
                  />
                  <Label htmlFor="sms-enabled" className="cursor-pointer">Enable SMS gateway</Label>
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <Button
                  onClick={handleSaveSms}
                  disabled={updateSms.isPending}
                  size="sm"
                >
                  {updateSms.isPending ? <><Loader2 className="w-3 h-3 animate-spin mr-1" />Saving...</> : "Save Settings"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleTestSms}
                  disabled={testSms.isPending || !smsConfigured}
                >
                  {testSms.isPending ? <><Loader2 className="w-3 h-3 animate-spin mr-1" />Testing...</> : <><Send className="w-3 h-3 mr-1" />Test Connection</>}
                </Button>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 text-xs space-y-1">
                <p className="font-medium text-muted-foreground">SMS Template:</p>
                <p className="font-mono text-muted-foreground">Dear [Name], your account ([ID]) has been recharged successfully. Amount: Rs.[LKR]. Next due: [Date]. - ASIAN DTH</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Firebase Authentication */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              Firebase Authentication
            </CardTitle>
            <StatusBadge enabled={appSettings?.firebaseAuth?.enabled ?? false} configured={fbAuthConfigured} />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {settingsLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading...
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Connect your Firebase project to enable Firebase Authentication alongside the local admin login.
              </p>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>API Key</Label>
                    <Input
                      value={fbAuthApiKey}
                      onChange={e => setFbAuthApiKey(e.target.value)}
                      placeholder="AIzaSy..."
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Auth Domain</Label>
                    <Input
                      value={fbAuthDomain}
                      onChange={e => setFbAuthDomain(e.target.value)}
                      placeholder="yourapp.firebaseapp.com"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Project ID</Label>
                    <Input
                      value={fbProjectId}
                      onChange={e => setFbProjectId(e.target.value)}
                      placeholder="your-project-id"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>App ID</Label>
                    <Input
                      value={fbAppId}
                      onChange={e => setFbAppId(e.target.value)}
                      placeholder="1:123456:web:abcdef"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3 py-1">
                  <Switch
                    checked={fbAuthEnabled}
                    onCheckedChange={setFbAuthEnabled}
                    id="fbauth-enabled"
                  />
                  <Label htmlFor="fbauth-enabled" className="cursor-pointer">Enable Firebase Authentication</Label>
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <Button
                  onClick={handleSaveFbAuth}
                  disabled={updateFbAuth.isPending}
                  size="sm"
                >
                  {updateFbAuth.isPending ? <><Loader2 className="w-3 h-3 animate-spin mr-1" />Saving...</> : "Save Settings"}
                </Button>
              </div>
              <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-xs text-blue-700 dark:text-blue-300 space-y-1">
                <p className="font-medium">How to get Firebase config</p>
                <p>Go to Firebase Console → Project Settings → Your Apps → Web App → Config object. Copy the values here.</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Firebase Database */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Database className="w-4 h-4 text-primary" />
              Firebase Database
            </CardTitle>
            <StatusBadge enabled={appSettings?.firebaseDb?.enabled ?? false} configured={fbDbConfigured} />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {settingsLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading...
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Configure Firestore / Realtime Database access. The service account JSON grants the server admin access to your Firebase project.
              </p>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Project ID</Label>
                    <Input
                      value={fbDbProjectId}
                      onChange={e => setFbDbProjectId(e.target.value)}
                      placeholder="your-project-id"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Database URL</Label>
                    <Input
                      value={fbDbUrl}
                      onChange={e => setFbDbUrl(e.target.value)}
                      placeholder="https://your-project.firebaseio.com"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Service Account JSON</Label>
                  <Textarea
                    value={fbDbServiceJson}
                    onChange={e => setFbDbServiceJson(e.target.value)}
                    placeholder={
                      appSettings?.firebaseDb?.serviceAccountJson === "••••••••"
                        ? "Service account JSON is saved. Paste new JSON to replace it."
                        : '{\n  "type": "service_account",\n  "project_id": "...",\n  ...\n}'
                    }
                    rows={5}
                    className="font-mono text-xs"
                  />
                  <p className="text-xs text-muted-foreground">
                    Paste the full JSON from Firebase Console → Project Settings → Service Accounts → Generate new private key
                  </p>
                </div>
                <div className="flex items-center gap-3 py-1">
                  <Switch
                    checked={fbDbEnabled}
                    onCheckedChange={setFbDbEnabled}
                    id="fbdb-enabled"
                  />
                  <Label htmlFor="fbdb-enabled" className="cursor-pointer">Enable Firebase Database</Label>
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <Button
                  onClick={handleSaveFbDb}
                  disabled={updateFbDb.isPending}
                  size="sm"
                >
                  {updateFbDb.isPending ? <><Loader2 className="w-3 h-3 animate-spin mr-1" />Saving...</> : "Save Settings"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleTestFbDb}
                  disabled={testFbDb.isPending || !fbDbConfigured}
                >
                  {testFbDb.isPending ? <><Loader2 className="w-3 h-3 animate-spin mr-1" />Testing...</> : <><Wifi className="w-3 h-3 mr-1" />Test Connection</>}
                </Button>
              </div>
            </>
          )}
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

      {/* Providers */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Info className="w-4 h-4 text-primary" />
            DTH Providers Reference
          </CardTitle>
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
