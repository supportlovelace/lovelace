import { useState } from "react";
import { 
  Bell, 
  CreditCard, 
  Users, 
  Link as LinkIcon, 
  Shield, 
  Webhook, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle,
  Slack,
  Mail,
  Gamepad2,
  MessageSquare,
  Key
} from "lucide-react";
import { cn } from "@repo/ui/lib/utils.ts";
import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import { Switch } from "@repo/ui/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/components/ui/card";

// --- MOCK DATA ---
const ALERTS = [
  { id: 1, name: "Critical Sentiment Drop", condition: "Sentiment < 4.0", duration: "1h", channels: ["Slack #alerts", "Email"], status: true },
  { id: 2, name: "Crash Spike Detection", condition: "Crash Rate > 2%", duration: "30m", channels: ["PagerDuty"], status: true },
];

const TEAM = [
  { id: 1, name: "John Doe", role: "Admin", email: "john@lovelace.gg", status: "Active" },
  { id: 2, name: "Sarah Connor", role: "CM", email: "sarah@lovelace.gg", status: "Active" },
];

const INTEGRATIONS = [
  { id: "steam", name: "Steam Web API", icon: Gamepad2, status: "connected", lastSync: "5m ago" },
  { id: "discord", name: "Discord Bot", icon: MessageSquare, status: "connected", lastSync: "1m ago" },
  { id: "jira", name: "Jira Cloud", icon: LinkIcon, status: "disconnected", lastSync: "-" },
  { id: "slack", name: "Slack Notifications", icon: Slack, status: "connected", lastSync: "1h ago" },
];

export default function Settings() {
  const [activeTab, setActiveTab] = useState("alerts");

  // --- SUB-PAGES ---

  const AlertsPage = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Alert Manager</h2>
          <p className="text-slate-500">Configure automated triggers to detect crises before they explode.</p>
        </div>
        <Button className="bg-slate-900 text-white gap-2"><Plus className="w-4 h-4" /> New Alert Rule</Button>
      </div>

      <div className="grid gap-4">
        {ALERTS.map(alert => (
          <Card key={alert.id} className="group border-slate-200 shadow-sm hover:border-slate-300 transition-all">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-red-50 rounded-xl border border-red-100 text-red-600">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">{alert.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                    <span className="bg-slate-100 px-2 py-0.5 rounded text-xs font-mono font-bold text-slate-600">IF {alert.condition}</span>
                    <span>for {alert.duration}</span>
                    <span>→</span>
                    <span className="flex items-center gap-1"><Slack className="w-3 h-3" /> {alert.channels[0]}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Switch checked={alert.status} />
                <Button variant="ghost" size="icon" className="text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const IntegrationsPage = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Data Connections</h2>
          <p className="text-slate-500">Manage your ingestion sources and output channels.</p>
        </div>
        <Button variant="outline" className="gap-2"><Key className="w-4 h-4" /> API Keys</Button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {INTEGRATIONS.map(int => (
          <Card key={int.id} className="border-slate-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-slate-50 rounded-lg text-slate-600">
                    <int.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">{int.name}</h3>
                    <p className="text-xs text-slate-500">Last sync: {int.lastSync}</p>
                  </div>
                </div>
                {int.status === "connected" ? (
                  <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100">
                    <CheckCircle2 className="w-3 h-3" /> Active
                  </span>
                ) : (
                  <Button size="sm" variant="outline" className="h-7 text-xs">Connect</Button>
                )}
              </div>
              {int.status === "connected" && (
                <div className="flex gap-2 mt-4">
                  <Button variant="ghost" size="sm" className="h-8 w-full text-xs border border-slate-100">Configure</Button>
                  <Button variant="ghost" size="sm" className="h-8 w-full text-xs border border-slate-100 text-red-500 hover:text-red-600 hover:bg-red-50">Disconnect</Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const TeamPage = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Team & Roles</h2>
          <p className="text-slate-500">Manage access to this workspace.</p>
        </div>
        <Button className="bg-slate-900 text-white gap-2"><Plus className="w-4 h-4" /> Invite Member</Button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {TEAM.map((member, i) => (
          <div key={member.id} className={cn("p-4 flex items-center justify-between", i !== TEAM.length - 1 && "border-b border-slate-100")}>
            <div className="flex items-center gap-4">
              <Avatar>
                <AvatarFallback>{member.name[0]}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-bold text-sm text-slate-900">{member.name}</p>
                <p className="text-xs text-slate-500">{member.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <span className="text-xs font-bold bg-slate-100 px-3 py-1 rounded-full text-slate-600">{member.role}</span>
              <Button variant="ghost" size="sm" className="text-slate-400">Edit</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="max-w-[1200px] mx-auto py-10 px-8 flex gap-12 min-h-screen">
      
      {/* SIDEBAR NAVIGATION */}
      <div className="w-64 shrink-0 space-y-8">
        <div>
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 px-2">Workspace</h3>
          <div className="space-y-1">
            <button onClick={() => setActiveTab("alerts")} className={cn("w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors", activeTab === "alerts" ? "bg-slate-100 text-slate-900" : "text-slate-500 hover:text-slate-900 hover:bg-slate-50")}>
              <Bell className="w-4 h-4" /> Alert Manager
            </button>
            <button onClick={() => setActiveTab("integrations")} className={cn("w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors", activeTab === "integrations" ? "bg-slate-100 text-slate-900" : "text-slate-500 hover:text-slate-900 hover:bg-slate-50")}>
              <Webhook className="w-4 h-4" /> Integrations
            </button>
            <button onClick={() => setActiveTab("team")} className={cn("w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors", activeTab === "team" ? "bg-slate-100 text-slate-900" : "text-slate-500 hover:text-slate-900 hover:bg-slate-50")}>
              <Users className="w-4 h-4" /> Team
            </button>
          </div>
        </div>

        <div>
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 px-2">Billing</h3>
          <div className="space-y-1">
            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors">
              <CreditCard className="w-4 h-4" /> Subscription
            </button>
            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors">
              <Shield className="w-4 h-4" /> Usage & Limits
            </button>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1">
        {activeTab === "alerts" && <AlertsPage />}
        {activeTab === "integrations" && <IntegrationsPage />}
        {activeTab === "team" && <TeamPage />}
      </div>

    </div>
  );
}