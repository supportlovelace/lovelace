import { 
  Gamepad2, Users, Zap, TrendingUp, Layers, Sparkles, 
  ArrowUpRight, ArrowDownRight, ChevronRight, Activity, 
  CheckCircle2
} from "lucide-react";
import { cn } from "@repo/ui/lib/utils.ts";
import { Button } from "@repo/ui/components/ui/button";
import { Link } from "wouter";

// --- MOCK DATA ---
const DOMAINS = [
  { 
    id: "core_gameplay", 
    name: "Gameplay", 
    icon: Gamepad2, 
    color: "#ef4444", 
    score: 6.8, 
    trend: "+2%", 
    isUp: true, 
    volume: "1.4k",
    severity: "stable",
    insights: [
      { title: "Weapon Balancing", status: "Critical", volume: 450 },
      { title: "Boss Difficulty Spike", status: "New", volume: 120 },
      { title: "Melee Hitbox", status: "Stable", volume: 80 }
    ]
  },
  { 
    id: "progression_systems", 
    name: "Progression", 
    icon: TrendingUp, 
    color: "#10b981", 
    score: 7.5, 
    trend: "+12%", 
    isUp: true, 
    volume: "850",
    severity: "healthy",
    insights: [
      { title: "Loot Rarity Distribution", status: "Stable", volume: 300 },
      { title: "XP Curve", status: "Stable", volume: 150 }
    ]
  },
  { 
    id: "social_multiplayer", 
    name: "Multiplayer", 
    icon: Users, 
    color: "#3b82f6", 
    score: 4.5, 
    trend: "-24%", 
    isUp: false, 
    volume: "3.1k",
    severity: "critical",
    insights: [
      { title: "Matchmaking Instability", status: "Critical", volume: 1240 },
      { title: "Co-op Desync", status: "High", volume: 890 },
      { title: "Friend Invite Bug", status: "New", volume: 450 }
    ]
  },
  { 
    id: "systems_ux", 
    name: "UX & Performance", 
    icon: Zap, 
    color: "#f59e0b", 
    score: 3.2, 
    trend: "-38%", 
    isUp: false, 
    volume: "4.2k",
    severity: "critical",
    insights: [
      { title: "Input Latency on PS5", status: "Critical", volume: 2100 },
      { title: "Menu Navigation Lag", status: "High", volume: 900 },
      { title: "HUD Scaling", status: "Medium", volume: 300 }
    ]
  },
  { 
    id: "visual_immersion", 
    name: "Visuals", 
    icon: Layers, 
    color: "#14b8a6", 
    score: 9.1, 
    trend: "+0.5%", 
    isUp: true, 
    volume: "310",
    severity: "healthy",
    insights: [
      { title: "Lighting VFX Praise", status: "Stable", volume: 120 }
    ]
  },
  { 
    id: "world_content", 
    name: "World", 
    icon: Sparkles, 
    color: "#8b5cf6", 
    score: 8.2, 
    trend: "-1%", 
    isUp: false, 
    volume: "620",
    severity: "healthy",
    insights: [
      { title: "Map Exploration", status: "Stable", volume: 200 },
      { title: "Secret Areas", status: "Rising", volume: 150 }
    ]
  },
];

const InsightRow = ({ insight }: { insight: any }) => (
  <div className="flex items-center justify-between py-2 group/row hover:bg-slate-50 rounded-lg px-2 -mx-2 transition-colors cursor-pointer">
    <div className="flex items-center gap-3 overflow-hidden">
      <div className={cn(
        "w-1.5 h-1.5 rounded-full shrink-0",
        insight.status === "Critical" ? "bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.6)] animate-pulse" : 
        insight.status === "High" ? "bg-orange-500" :
        insight.status === "New" ? "bg-blue-500" : "bg-slate-300"
      )} />
      <span className="text-sm font-medium text-slate-700 truncate group-hover/row:text-slate-900">{insight.title}</span>
    </div>
    <div className="flex items-center gap-3 shrink-0">
      <span className="text-xs text-slate-400 font-mono">{insight.volume}</span>
      <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover/row:text-slate-500" />
    </div>
  </div>
);

export function InsightsOverview() {
  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Health Radar</h1>
          <p className="text-sm text-slate-500">Real-time community signals analysis across game domains.</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200/50">
          <button className="px-4 py-1 text-xs font-semibold text-slate-900 bg-white shadow-sm rounded-md border border-slate-200">7D</button>
          <button className="px-4 py-1 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors">30D</button>
        </div>
      </div>

      {/* Grid des Domaines */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {DOMAINS.map((domain) => (
          <Link key={domain.id} href={`/${domain.id}`} className="group bg-white border border-slate-200 rounded-2xl p-0 hover:border-slate-300 hover:shadow-lg transition-all cursor-pointer relative overflow-hidden flex flex-col h-[320px]">
            {/* Header: Score & Info */}
            <div className="p-6 pb-4 border-b border-slate-50 bg-slate-50/30">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div 
                    className="p-2 rounded-xl border shadow-sm transition-transform group-hover:scale-105"
                    style={{ backgroundColor: 'white', color: domain.color, borderColor: `${domain.color}20` }}
                  >
                    <domain.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{domain.name}</h3>
                    <div className="flex items-center gap-1.5 mt-0.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <Activity className="w-3 h-3" />
                      {domain.volume} signals
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="flex items-baseline justify-end gap-0.5">
                    <span className={cn("text-2xl font-black tracking-tight", domain.score < 5 ? "text-red-600" : "text-slate-900")}>
                      {domain.score}
                    </span>
                    <span className="text-xs font-bold text-slate-300">/10</span>
                  </div>
                  <div className={cn("flex items-center justify-end gap-1 text-[10px] font-bold mt-0.5", domain.isUp ? "text-emerald-600" : "text-red-600")}>
                    {domain.isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {domain.trend}
                  </div>
                </div>
              </div>
            </div>

            {/* Body: Top Insights */}
            <div className="flex-1 p-6 bg-white flex flex-col">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Top Detected Issues</p>
              
              <div className="space-y-1 flex-1">
                {domain.insights.map((insight, idx) => (
                  <InsightRow key={idx} insight={insight} />
                ))}
                {domain.insights.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-slate-300 text-xs italic">
                    <CheckCircle2 className="w-6 h-6 mb-2 opacity-50" />
                    No critical issues
                  </div>
                )}
              </div>

              {/* Footer discret */}
              <div className="pt-4 mt-2 border-t border-slate-50 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <span className="text-[10px] font-medium text-slate-400">View details</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
