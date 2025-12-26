import { useAppContext } from "../stores/useAppContext";
import { 
  Sparkles, 
  MessageSquare, 
  AlertTriangle, 
  CheckCircle2, 
  Activity, 
  GitMerge, 
  Bug, 
  TrendingUp, 
  Users, 
  DollarSign 
} from "lucide-react";
import { Button } from "@repo/ui/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/components/ui/avatar";

// --- MOCK DATA FOR WIDGETS ---
const ADA_BRIEFING = {
  CM: "Good morning! Community sentiment is stable, but there's a rising frustration regarding the 'Ranked Matchmaking' in Asia. 3 major influencers posted about it.",
  DEV: "Heads up: Build v1.4.2 introduced a regression in 'RelayAllocator.cpp'. Crash rate increased by 2.5% on Steam Deck.",
  CEO: "Portfolio health is solid (7.8/10). 'Ravenswatch' retention is up +15% week-over-week following the content update.",
  ADMIN: "System status: All ingestion pipelines operational. 3 new user accounts awaiting approval."
};

export default function Dashboard() {
  const { persona, user } = useAppContext(); // Assuming user is in context or we get it from store
  const currentPersona = persona || "CM";

  // --- WIDGETS COMPONENTS ---

  const AdaBriefing = () => (
    <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-8 rounded-3xl shadow-lg relative overflow-hidden mb-8">
      <div className="absolute top-0 right-0 p-12 opacity-10">
        <Sparkles className="w-32 h-32" />
      </div>
      <div className="relative z-10 space-y-4">
        <div className="flex items-center gap-2 text-blue-400 font-bold text-xs uppercase tracking-widest">
          <Sparkles className="w-4 h-4" /> Daily Briefing
        </div>
        <h1 className="text-3xl font-bold">
          Hello, <span className="text-blue-200">User</span>.
        </h1>
        <p className="text-lg text-slate-300 max-w-3xl leading-relaxed">
          "{ADA_BRIEFING[currentPersona as keyof typeof ADA_BRIEFING]}"
        </p>
        <Button variant="outline" className="mt-4 border-white/20 text-white hover:bg-white/10 hover:text-white">
          Ask A.D.A for details
        </Button>
      </div>
    </div>
  );

  const WidgetInbox = () => (
    <Card className="h-full border-slate-200 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-bold uppercase text-slate-500 flex items-center gap-2">
          <MessageSquare className="w-4 h-4" /> Inbox Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center p-3 bg-red-50 rounded-xl border border-red-100">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <span className="font-bold text-slate-700">Critical</span>
            </div>
            <span className="font-black text-xl text-red-600">12</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="font-medium text-slate-600">Unread</span>
            <span className="font-bold text-lg text-slate-900">45</span>
          </div>
          <Button className="w-full">Open Hub</Button>
        </div>
      </CardContent>
    </Card>
  );

  const WidgetDevHealth = () => (
    <Card className="h-full border-slate-200 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-bold uppercase text-slate-500 flex items-center gap-2">
          <Activity className="w-4 h-4" /> Build Health (v1.4.2)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-600">Crash Rate</span>
            <span className="font-bold text-red-500">2.4% <span className="text-xs text-red-400">(+0.5%)</span></span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-600">Performance</span>
            <span className="font-bold text-emerald-600">60 FPS <span className="text-xs text-emerald-400">(Stable)</span></span>
          </div>
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <GitMerge className="w-3.5 h-3.5" /> Last deploy: 2h ago
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const WidgetTopIssues = () => (
    <Card className="col-span-2 border-slate-200 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-bold uppercase text-slate-500 flex items-center gap-2">
          <Bug className="w-4 h-4" /> Top Active Issues
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-slate-100">
              <div className="flex items-center gap-3">
                <span className="bg-red-100 text-red-600 px-2 py-0.5 rounded text-[10px] font-bold uppercase">P1</span>
                <span className="font-medium text-slate-700 text-sm">Matchmaking Timeout in Asia</span>
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-400">
                <span>1.2k mentions</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  const WidgetKpi = ({ label, value, trend, icon: Icon }: any) => (
    <Card className="border-slate-200 shadow-sm">
      <CardContent className="p-6 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{value}</span>
            <span className="text-xs font-bold text-emerald-600">{trend}</span>
          </div>
        </div>
        <div className="p-3 bg-slate-50 rounded-xl text-slate-400">
          <Icon className="w-6 h-6" />
        </div>
      </CardContent>
    </Card>
  );

  // --- PERSONA LAYOUTS ---

  const RenderCM = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {/* Colonne Gauche: Action */}
      <div className="space-y-8">
        <WidgetInbox />
        <Card className="border-slate-200 shadow-sm">
          <CardHeader><CardTitle className="text-sm font-bold uppercase text-slate-500">Sentiment Alert</CardTitle></CardHeader>
          <CardContent>
            <div className="text-center py-6">
              <div className="text-4xl font-black text-yellow-500 mb-2">6.2</div>
              <p className="text-xs text-slate-400 font-bold uppercase">Neutral / Caution</p>
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Colonne Droite: Context */}
      <div className="md:col-span-2 space-y-8">
        <WidgetTopIssues />
        <div className="grid grid-cols-2 gap-4">
          <WidgetKpi label="Weekly Volume" value="12.5k" trend="+12%" icon={MessageSquare} />
          <WidgetKpi label="Response Rate" value="94%" trend="+2%" icon={CheckCircle2} />
        </div>
      </div>
    </div>
  );

  const RenderDEV = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="space-y-8">
        <WidgetDevHealth />
      </div>
      <div className="md:col-span-2 space-y-8">
        <WidgetTopIssues />
        <div className="grid grid-cols-2 gap-4">
          <WidgetKpi label="New Bugs" value="24" trend="-5%" icon={Bug} />
          <WidgetKpi label="Critical Regressions" value="2" trend="+1" icon={AlertTriangle} />
        </div>
      </div>
    </div>
  );

  const RenderCEO = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="md:col-span-3 grid grid-cols-3 gap-4">
        <WidgetKpi label="Portfolio Health" value="7.8" trend="+0.2" icon={Activity} />
        <WidgetKpi label="Active Players" value="450k" trend="+5%" icon={Users} />
        <WidgetKpi label="Est. Revenue Risk" value="$0" trend="Stable" icon={DollarSign} />
      </div>
      <div className="md:col-span-2">
        <WidgetTopIssues />
      </div>
      <div>
        <Card className="h-full border-slate-200 shadow-sm bg-slate-900 text-white">
          <CardHeader><CardTitle className="text-sm font-bold uppercase text-blue-400">Strategic Insight</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed text-slate-300">
              "Action/RPG genre is trending up (+15%) on Twitch. Consider accelerating the DLC roadmap for Ravenswatch to capitalize on this window."
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  return (
    <div className="h-full overflow-y-auto custom-scrollbar">
      <div className="max-w-[1400px] mx-auto py-10 px-8">
        <AdaBriefing />
        
        {currentPersona === "CM" && <RenderCM />}
        {currentPersona === "DEV" && <RenderDEV />}
        {currentPersona === "CEO" && <RenderCEO />}
        {currentPersona === "ADMIN" && <RenderCEO />} {/* Fallback for Admin */}
      </div>
    </div>
  );
}

function ChevronRight(props: any) {
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
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}