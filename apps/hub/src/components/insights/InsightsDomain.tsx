import { useRoute, Link } from "wouter";
import { 
  ArrowLeft, 
  ChevronRight, 
  Search, 
  Filter, 
  MessageSquare, 
  Clock, 
  ArrowUpRight, 
  ArrowDownRight,
  ChevronDown,
  ChevronUp,
  Layers
} from "lucide-react";
import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import { cn } from "@repo/ui/lib/utils.ts";
import { useState } from "react";

// --- MOCK DATA FOR LEVEL 2 (GROUPED) ---
const MOCK_DOMAIN_DATA: any = {
  social_multiplayer: {
    name: "Social & Multiplayer",
    score: 4.5,
    volume: "3.1k",
    icon: Layers,
    color: "#3b82f6",
    themes: [
      {
        id: "theme_matchmaking",
        title: "Matchmaking Instability",
        severity: "Critical",
        volume: 1240,
        trend: "+45%",
        signals: [
          { id: "sig_1", title: "Timeout in Asia Region", volume: 800, severity: "Critical", status: "Investigating", lastSeen: "10m ago" },
          { id: "sig_2", title: "Cross-play connection failure (PS5/PC)", volume: 320, severity: "High", status: "Confirmed", lastSeen: "1h ago" },
          { id: "sig_3", title: "Ranked Lobby loop", volume: 120, severity: "Medium", status: "New", lastSeen: "2h ago" }
        ]
      },
      {
        id: "theme_coop",
        title: "Co-op Experience",
        severity: "High",
        volume: 890,
        trend: "+12%",
        signals: [
          { id: "sig_4", title: "Desync in Chapter 2 Boss", volume: 600, severity: "High", status: "Fix Ready", lastSeen: "30m ago" },
          { id: "sig_5", title: "Revive mechanic bug", volume: 290, severity: "Medium", status: "To Consider", lastSeen: "1d ago" }
        ]
      },
      {
        id: "theme_chat",
        title: "Communication & Chat",
        severity: "Low",
        volume: 450,
        trend: "-5%",
        signals: [
          { id: "sig_6", title: "Voice Chat low volume", volume: 450, severity: "Low", status: "Stable", lastSeen: "5h ago" }
        ]
      }
    ]
  }
};

const SeverityBadge = ({ level }: { level: string }) => {
  const configs: any = {
    Critical: "bg-red-50 text-red-600 border-red-100",
    High: "bg-orange-50 text-orange-600 border-orange-100",
    Medium: "bg-amber-50 text-amber-600 border-amber-100",
    Low: "bg-slate-50 text-slate-500 border-slate-100",
  };
  return (
    <span className={cn("px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border", configs[level] || configs.Low)}>
      {level}
    </span>
  );
};

const StatusBadge = ({ status }: { status: string }) => {
  const configs: any = {
    Investigating: "bg-blue-50 text-blue-600 border-blue-100",
    Confirmed: "bg-purple-50 text-purple-600 border-purple-100",
    "Fix Ready": "bg-emerald-50 text-emerald-600 border-emerald-100",
    "To Consider": "bg-slate-50 text-slate-500 border-slate-100",
    New: "bg-indigo-50 text-indigo-600 border-indigo-100",
  };
  return (
    <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold border", configs[status] || "bg-slate-50 text-slate-400 border-slate-100")}>
      {status}
    </span>
  );
};

export function InsightsDomain() {
  const [, params] = useRoute("/insights/:domainId");
  const domainId = params?.domainId || "social_multiplayer";
  const domain = MOCK_DOMAIN_DATA[domainId] || MOCK_DOMAIN_DATA.social_multiplayer;
  const [expandedThemes, setExpandedThemes] = useState<string[]>([domain.themes[0].id]); // Expand first by default

  const toggleTheme = (id: string) => {
    setExpandedThemes(prev => 
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-2 duration-500">
      {/* Breadcrumbs & Header */}
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400">
          <Link href="/" className="hover:text-slate-900 transition-colors">Insights</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-slate-900">{domain.name}</span>
        </div>

        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl border bg-white shadow-sm" style={{ color: domain.color }}>
              <domain.icon className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tighter text-slate-900">{domain.name}</h1>
              <p className="text-sm text-slate-500">Grouped by {domain.themes.length} major themes.</p>
            </div>
          </div>

          <div className="flex items-center gap-6 bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Domain Health</p>
              <div className="flex items-baseline gap-1 justify-end">
                <span className="text-2xl font-black" style={{ color: domain.score < 5 ? '#ef4444' : '#10b981' }}>{domain.score}</span>
                <span className="text-xs text-slate-300 font-bold">/10</span>
              </div>
            </div>
            <div className="h-8 w-[1px] bg-slate-100" />
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Volume</p>
              <p className="text-lg font-bold text-slate-900">{domain.volume}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Themes List */}
      <div className="space-y-4">
        {domain.themes.map((theme: any) => {
          const isExpanded = expandedThemes.includes(theme.id);
          return (
            <div key={theme.id} className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden transition-all">
              {/* Theme Header (Macro) */}
              <div 
                className={cn(
                  "p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors",
                  isExpanded && "border-b border-slate-100 bg-slate-50/50"
                )}
                onClick={() => toggleTheme(theme.id)}
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center transition-transform",
                    isExpanded ? "bg-slate-200 text-slate-600 rotate-90" : "bg-slate-100 text-slate-400"
                  )}>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{theme.title}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <SeverityBadge level={theme.severity} />
                      <span className="text-xs text-slate-500 font-medium">{theme.signals.length} specific signals</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-8">
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Volume</p>
                    <p className="text-sm font-bold text-slate-700">{theme.volume}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Trend</p>
                    <div className="text-sm font-bold text-red-600 flex items-center justify-end gap-1">
                      {theme.trend} <ArrowUpRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Signals List (Micro) */}
              {isExpanded && (
                <div className="bg-slate-50/30">
                  <table className="w-full text-left">
                    <tbody>
                      {theme.signals.map((signal: any) => (
                        <tr key={signal.id} className="group border-b border-slate-100 last:border-none hover:bg-white transition-colors">
                          <td className="p-0" colSpan={7}>
                            <Link href={`/${domainId}/${signal.id}`} className="flex w-full items-center py-4 px-6">
                              <div className="w-20 shrink-0" /> {/* Spacer for alignment */}
                              <div className="flex-1 flex items-center gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-slate-300 group-hover:bg-primary transition-colors" />
                                <span className="text-sm font-semibold text-slate-700 group-hover:text-slate-900">{signal.title}</span>
                              </div>
                              <div className="w-32 px-4"><SeverityBadge level={signal.severity} /></div>
                              <div className="w-32 px-4">
                                <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                                  <MessageSquare className="w-3 h-3" />
                                  {signal.volume}
                                </div>
                              </div>
                              <div className="w-32 px-4"><StatusBadge status={signal.status} /></div>
                              <div className="w-32 px-4 text-right">
                                <div className="flex items-center justify-end gap-1.5 text-xs text-slate-400">
                                  <Clock className="w-3 h-3" />
                                  {signal.lastSeen}
                                </div>
                              </div>
                              <div className="w-10 pr-0 text-right">
                                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-primary" />
                              </div>
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}