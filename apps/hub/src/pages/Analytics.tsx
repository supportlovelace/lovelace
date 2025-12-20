import { useState } from "react";
import { 
  Plus, 
  BarChart3, 
  LineChart, 
  PieChart, 
  Settings2, 
  Calendar,
  Download,
  Filter,
  X,
  Sparkles,
  TrendingUp,
  Activity,
  MessageSquare,
  Users,
  Gamepad2
} from "lucide-react";
import { cn } from "@repo/ui/lib/utils.ts";
import { Button } from "@repo/ui/components/ui/button";
import { Card, CardContent } from "@repo/ui/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@repo/ui/components/ui/select";

// --- MOCK METRICS REGISTRY ---
const AVAILABLE_METRICS = [
  { id: "steam_sentiment", label: "Steam Sentiment", source: "Steam", icon: ThumbsUp, color: "#3b82f6" },
  { id: "discord_volume", label: "Discord Messages", source: "Discord", icon: MessageSquare, color: "#5865F2" },
  { id: "ccu_players", label: "Concurrent Players", source: "SDK/Steam", icon: Users, color: "#10b981" },
  { id: "reddit_karma", label: "Reddit Engagement", source: "Reddit", icon: MessageCircle, color: "#FF4500" },
  { id: "crash_rate", label: "Crash Rate", source: "SDK", icon: AlertTriangle, color: "#ef4444" },
];

export default function Analytics() {
  const [activeSeries, setActiveSeries] = useState<string[]>(["steam_sentiment", "ccu_players"]);
  const [granularity, setGranularity] = useState("daily");

  const addSeries = (id: string) => {
    if (!activeSeries.includes(id)) setActiveSeries([...activeSeries, id]);
  };

  const removeSeries = (id: string) => {
    setActiveSeries(activeSeries.filter(s => s !== id));
  };

  return (
    <div className="flex h-[calc(100vh-100px)] -m-8 overflow-hidden bg-slate-50/30">
      
      {/* 1. BUILDER SIDEBAR */}
      <div className="w-80 bg-white border-r border-slate-200 p-6 flex flex-col gap-6 overflow-y-auto">
        <div>
          <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400 mb-4">Metric Builder</h2>
          <div className="space-y-3">
            <p className="text-[11px] font-medium text-slate-500 mb-2 italic">Add metrics to correlate data</p>
            <Select onValueChange={addSeries}>
              <SelectTrigger className="w-full h-10 border-slate-200 rounded-xl bg-slate-50">
                <div className="flex items-center gap-2">
                  <Plus className="w-4 h-4 text-slate-400" />
                  <span className="text-xs font-bold text-slate-600">Add Metric</span>
                </div>
              </SelectTrigger>
              <SelectContent>
                {AVAILABLE_METRICS.filter(m => !activeSeries.includes(m.id)).map(metric => (
                  <SelectItem key={metric.id} value={metric.id} className="text-xs font-medium py-2.5">
                    {metric.label} ({metric.source})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Separator className="bg-slate-100" />

        {/* Active Series Management */}
        <div className="flex-1 space-y-4">
          <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Active Layers</h2>
          <div className="space-y-3">
            {activeSeries.map(sId => {
              const metric = AVAILABLE_METRICS.find(m => m.id === sId);
              if (!metric) return null;
              return (
                <div key={sId} className="p-3 border border-slate-100 bg-white rounded-xl shadow-sm flex flex-col gap-2 group animate-in slide-in-from-left-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: metric.color }} />
                      <span className="text-xs font-bold text-slate-900">{metric.label}</span>
                    </div>
                    <button onClick={() => removeSeries(sId)} className="text-slate-300 hover:text-red-500 transition-colors">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                    <span className="uppercase">{metric.source}</span>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 text-emerald-500" /> +5.2%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* A.D.A Quick Insight */}
        <div className="bg-purple-50 rounded-2xl p-4 border border-purple-100">
          <div className="flex items-center gap-2 text-purple-600 font-bold text-[10px] uppercase tracking-widest mb-2">
            <Sparkles className="w-3.5 h-3.5" /> A.D.A Prediction
          </div>
          <p className="text-xs text-purple-900 leading-relaxed font-medium">
            Strong correlation (0.85) detected between <span className="font-bold">Steam Sentiment</span> and <span className="font-bold">CCU</span> over the last 48h.
          </p>
        </div>
      </div>

      {/* 2. MAIN CANVAS */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* Toolbar */}
        <div className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between shrink-0 shadow-sm z-10">
          <div className="flex items-center gap-4">
            <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200/50">
              {["daily", "weekly", "hourly"].map(g => (
                <button
                  key={g}
                  onClick={() => setGranularity(g)}
                  className={cn(
                    "px-4 py-1 text-[10px] font-black uppercase tracking-widest rounded-md transition-all",
                    granularity === g ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  {g}
                </button>
              ))}
            </div>
            <div className="h-6 w-[1px] bg-slate-200 mx-2" />
            <Button variant="ghost" size="sm" className="text-xs font-bold gap-2 text-slate-500">
              <Calendar className="w-4 h-4" /> Dec 1 - Dec 20, 2025
            </Button>
          </div>
          
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="h-9 text-xs font-bold gap-2 border-slate-200">
              <Download className="w-3.5 h-3.5" /> Export PDF
            </Button>
            <Button className="h-9 text-xs font-bold gap-2 bg-slate-900 text-white">
              <Settings2 className="w-3.5 h-3.5" /> Lab Settings
            </Button>
          </div>
        </div>

        {/* Chart Viewport */}
        <div className="flex-1 p-8 overflow-y-auto space-y-8">
          <Card className="border-slate-200 shadow-xl rounded-[2rem] bg-white overflow-hidden">
            <div className="p-8 border-b border-slate-50 bg-slate-50/20 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-black tracking-tight text-slate-900">Multi-Series Correlation</h3>
                <p className="text-sm text-slate-400 font-medium">Cross-referencing {activeSeries.length} data streams</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="text-slate-400 hover:bg-slate-100"><LineChart className="w-5 h-5" /></Button>
                <Button variant="ghost" size="icon" className="text-slate-400 hover:bg-slate-100"><BarChart3 className="w-5 h-5" /></Button>
              </div>
            </div>
            <CardContent className="p-10 h-[500px] flex items-center justify-center relative">
              {/* ECharts Area Placeholder */}
              <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#e2e8f0_1.5px,transparent_1.5px)] [background-size:24px_24px]" />
              <div className="z-10 flex flex-col items-center gap-4">
                <Activity className="w-12 h-12 text-slate-200 animate-pulse" />
                <p className="text-slate-400 font-mono text-xs">Waiting for Cube.js data stream...</p>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats Summary Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {activeSeries.map(sId => {
              const metric = AVAILABLE_METRICS.find(m => m.id === sId);
              if (!metric) return null;
              return (
                <Card key={sId} className="border-slate-200 shadow-sm rounded-2xl bg-white p-5 flex flex-col gap-1">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{metric.label}</span>
                  <div className="flex items-baseline justify-between mt-1">
                    <span className="text-xl font-bold text-slate-900">84.2</span>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">+2.4%</span>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </div>

    </div>
  );
}

function ThumbsUp(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M7 10v12" />
      <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z" />
    </svg>
  );
}

function MessageCircle(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
    </svg>
  );
}

function AlertTriangle(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  );
}

function Separator({ className }: { className?: string }) {
  return <div className={cn("h-[1px] w-full bg-slate-200", className)} />;
}