import { useRoute, Link } from "wouter";
import { 
  Share2,
  ExternalLink,
  History,
  Activity,
  Send,
  User,
  Sparkles,
  GitCommit,
  FileCode,
  ArrowLeft,
  MessageSquare,
  ThumbsUp,
  Cpu,
  Globe,
  AlertTriangle,
  Laptop,
  BarChart3,
  PieChart,
  Gauge,
  FileDiff
} from "lucide-react";
import { Button } from "@repo/ui/components/ui/button";
import { cn } from "@repo/ui/lib/utils.ts";
import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/components/ui/avatar";
import { Input } from "@repo/ui/components/ui/input";

// --- MOCK DATA ---
const MOCK_SIGNAL_DATA = {
  id: "sig_1",
  title: "Timeout in Asia Region during Matchmaking",
  status: "Investigating",
  severity: "Critical",
  volume: 800,
  impact: "-15% Retention in Asia",
  firstSeen: "2024-05-20 14:30",
  description: "Players in SEA and JP regions are reporting connection timeouts after 60s in the matchmaking queue.",
  
  ada_report: "I've detected a high-confidence anomaly localized in Southeast Asia. 92% of affected players are on PC, and latency logs show consistent packet loss at regional relay nodes, suggesting a routing issue rather than a client crash.",

  // Realistic Correlations
  correlations: [
    { label: "Region", value: "Asia (SEA/JP)", confidence: "98%", icon: Globe },
    { label: "Platform", value: "PC (Steam)", confidence: "92%", icon: Laptop },
    { label: "Version", value: "Build v1.4.2", confidence: "100%", icon: History },
  ],

  git: {
    commit: "882a4f1",
    author: "m.rossi",
    message: "feat(net): optimize relay allocation for low latency",
    suspect_file: "src/services/matchmaker/RelayAllocator.cpp",
    reason: "A.D.A matched keywords 'Timeout' and 'Connection' from user reports with code changes in network timeout logic found in this file.",
    total_files: 12
  },

  evidence: [
    { source: "Steam", user: "NinjaWarrior", content: "Can't play since update. Im in Tokyo and it just spins forever then error 504. My internet is fine.", highlight: "spins forever then error 504", date: "2h ago" },
    { source: "Discord", user: "Kai", content: "Anyone else getting DCed immediately in Singapore server? I tried 5 times.", highlight: "DCed immediately in Singapore server", date: "3h ago" }
  ],

  comments: [
    { user: "Sarah", role: "CM", content: "I'm seeing a spike on Twitter too. Should we tweet?", time: "1h ago" },
    { user: "Mike", role: "Dev", content: "Checking the logs. A.D.A seems right about the timeout value.", time: "30m ago" }
  ]
};

export function InsightDetail() {
  const [, params] = useRoute("/insights/:domainId/:insightId");
  const domainId = params?.domainId;
  const data = MOCK_SIGNAL_DATA;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-2 duration-500 pb-20">
      
      {/* 1. Header */}
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400">
          <Link href="/" className="hover:text-slate-900 transition-colors">Insights</Link>
          <span className="text-slate-300">/</span>
          <Link href={`/${domainId}`} className="hover:text-slate-900 transition-colors">{domainId?.replace('_', ' ')}</Link>
          <span className="text-slate-300">/</span>
          <span className="text-slate-900">Signal Details</span>
        </div>

        <div className="flex justify-between items-start">
          <div className="space-y-2 max-w-3xl">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 leading-tight">{data.title}</h1>
            <p className="text-base text-slate-500 font-medium">{data.description}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="h-9 text-xs font-bold gap-2 border-slate-200">
              <Share2 className="w-3.5 h-3.5" /> Share
            </Button>
            <Button size="sm" className="h-9 text-xs font-bold gap-2 bg-slate-900 text-white hover:bg-slate-800">
              <ExternalLink className="w-3.5 h-3.5" /> Jira Ticket
            </Button>
          </div>
        </div>

        {/* 2. KPI Strip */}
        <div className="flex items-center gap-8 py-4 border-y border-slate-100">
          <div className="flex items-center gap-2.5">
            <span className="flex h-2 w-2 rounded-full bg-red-600 animate-pulse" />
            <span className="text-sm font-bold text-slate-900 uppercase tracking-wide">{data.status}</span>
          </div>
          <div className="h-4 w-[1px] bg-slate-200" />
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Impact</span>
            <span className="text-xs font-bold text-red-600">{data.impact}</span>
          </div>
          <div className="h-4 w-[1px] bg-slate-200" />
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Volume</span>
            <span className="text-xs font-bold text-slate-900">{data.volume} Mentions</span>
          </div>
          <div className="h-4 w-[1px] bg-slate-200" />
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">First Seen</span>
            <span className="text-xs font-bold text-slate-900">{data.firstSeen}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: MAIN CONTENT (8/12) */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* 3. The 3 Key Charts (Restored) */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm h-40 flex flex-col">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-2">
                <Activity className="w-3.5 h-3.5" /> Volume Trend
              </h4>
              <div className="flex-1 bg-slate-50/50 rounded border border-slate-100 flex items-center justify-center text-slate-300">
                <BarChart3 className="w-6 h-6 opacity-50" />
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm h-40 flex flex-col">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-2">
                <Cpu className="w-3.5 h-3.5" /> Platform Split
              </h4>
              <div className="flex-1 bg-slate-50/50 rounded border border-slate-100 flex items-center justify-center text-slate-300">
                <PieChart className="w-6 h-6 opacity-50" />
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm h-40 flex flex-col">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-2">
                <ThumbsUp className="w-3.5 h-3.5" /> Sentiment
              </h4>
              <div className="flex-1 bg-slate-50/50 rounded border border-slate-100 flex items-center justify-center text-slate-300">
                <Gauge className="w-6 h-6 opacity-50" />
              </div>
            </div>
          </div>

          {/* 4. A.D.A Analysis */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-purple-500" />
            
            <div className="flex items-center gap-2 text-purple-600 font-bold text-[10px] uppercase tracking-widest mb-3">
              <Sparkles className="w-3.5 h-3.5" /> A.D.A Intelligence Report
            </div>
            <p className="text-slate-700 text-sm font-medium leading-relaxed">
              {data.ada_report}
            </p>
            
            <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-50">
              {data.correlations.map((corr, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="p-2 bg-slate-50 rounded-lg text-slate-500"><corr.icon className="w-4 h-4" /></div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">{corr.label}</p>
                    <p className="text-xs font-bold text-slate-900">{corr.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 5. A.D.A Technical Investigation (Root Cause) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
              <GitCommit className="w-4 h-4" /> A.D.A Code Investigation
            </h3>
            
            <div className="flex items-start gap-4 p-4 bg-slate-50/50 rounded-xl border border-slate-100">
              <div className="flex-1 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">{data.git.commit}</span>
                    <span className="text-xs text-slate-400">by {data.git.author}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100">
                    <AlertTriangle className="w-3 h-3" />
                    Top Suspect
                  </div>
                </div>
                
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">A.D.A Reasoning</p>
                  <p className="text-xs text-slate-700 italic leading-snug">"{data.git.reason}"</p>
                </div>

                <div className="pt-2 border-t border-slate-200">
                  <div className="flex items-center gap-2 mb-1">
                    <FileCode className="w-3.5 h-3.5 text-slate-400" />
                    <p className="text-xs font-mono text-slate-900 break-all">{data.git.suspect_file}</p>
                  </div>
                </div>
              </div>
            </div>

            <Button variant="outline" className="w-full mt-4 text-xs font-bold border-slate-200 h-10 gap-2">
              <FileDiff className="w-4 h-4 text-slate-500" />
              View all {data.git.total_files} files changed in Build v1.4.2
            </Button>
          </div>

          {/* 6. Evidence List */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4 px-1">Key Evidence</h3>
            <div className="space-y-3">
              {data.evidence.map((msg, i) => (
                <div key={i} className="bg-white border border-slate-200 p-5 rounded-xl hover:border-slate-300 transition-colors">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 rounded text-slate-600 uppercase">{msg.source}</span>
                      <span className="text-xs font-bold text-slate-900">{msg.user}</span>
                    </div>
                    <span className="text-[10px] font-medium text-slate-400">{msg.date}</span>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {msg.content.split(msg.highlight).map((part, idx, arr) => (
                      <span key={idx}>
                        {part}
                        {idx < arr.length - 1 && (
                          <span className="bg-slate-900 text-white px-1 py-0.5 rounded font-medium mx-0.5 selection:bg-purple-300">
                            {msg.highlight}
                          </span>
                        )}
                      </span>
                    ))}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: DISCUSSION (4/12) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col h-[600px] sticky top-6">
            <div className="p-4 border-b border-slate-100 bg-slate-50/30">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <MessageSquare className="w-3.5 h-3.5" /> Team Discussion
              </h3>
            </div>
            
            <div className="flex-1 p-4 overflow-y-auto space-y-5">
              {data.comments.map((comment, i) => (
                <div key={i} className="flex gap-3">
                  <Avatar className="w-7 h-7 mt-0.5 border border-slate-100">
                    <AvatarFallback className="bg-slate-100 text-slate-600 text-[10px] font-bold">{comment.user[0]}</AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">{comment.user}</span>
                      <span className="text-[10px] text-slate-400">{comment.time}</span>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-xl rounded-tl-none border border-slate-100 text-xs text-slate-700 leading-relaxed">
                      {comment.content}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 border-t border-slate-100 bg-white rounded-b-2xl">
              <div className="flex gap-2">
                <Input placeholder="Type a note..." className="text-xs h-9 bg-slate-50 border-slate-200 focus-visible:ring-1" />
                <Button size="icon" className="h-9 w-9 bg-slate-900 shrink-0">
                  <Send className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}