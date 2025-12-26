import { useState } from "react";
import { 
  Inbox, AlertTriangle, Lightbulb, Trash2, Search, Filter,
  MoreHorizontal, Reply, Sparkles, Gamepad2, MessageCircle, Users,
  Youtube, Pin, CheckCircle2, MessageSquare, Video, CornerDownRight,
  Plus, History, Send, X, ExternalLink, Languages,
  Tag, PanelLeftClose, PanelLeftOpen, PanelRightOpen, PanelRightClose,
  Info, ThumbsUp, Star
} from "lucide-react";
import { cn } from "@repo/ui/lib/utils.ts";
import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/components/ui/avatar";
import { Textarea } from "@repo/ui/components/ui/textarea";
import { ScrollArea } from "@repo/ui/components/ui/scroll-area";
import { TheHubLegacy } from "./TheHubLegacy";
import { useAppContext } from "../stores/useAppContext";

// --- MOCK DATA RICHE ---
const MESSAGES = [
  {
    id: 1,
    source: "YouTube",
    channel: "IronGamer",
    type: "video",
    author: "IronGamer",
    avatar: "https://i.pravatar.cc/150?u=iron",
    date: "2h ago",
    title: "Is Ravenswatch the next Hades? (Review)",
    content: "Honestly, the combat feels a bit floaty compared to Hades, but the co-op is a game changer. Here is my full breakdown...",
    thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg",
    sentiment: 6.5,
    relevance: 9.2,
    likes: 1200,
    comments: 45,
    folder: "inbox",
    read: false,
    category: "Review",
    tags: ["Gameplay", "Comparison"],
    isTranslated: false
  },
  {
    id: 2,
    source: "Discord",
    channel: "#bugs-report",
    type: "text",
    author: "BugHunter",
    avatar: "https://i.pravatar.cc/150?u=bug",
    date: "10m ago",
    title: "Crash on Startup (Error 504)",
    content: "I keep getting Error 504 when launching the game via Steam Deck. Logs attached.",
    sentiment: 1.2,
    relevance: 8.5,
    likes: 3,
    comments: 12,
    folder: "bugs",
    read: false,
    pinned: true,
    category: "Bug",
    tags: ["Steam Deck", "Critical"],
    isTranslated: false
  },
  {
    id: 3,
    source: "Reddit",
    channel: "r/Ravenswatch",
    type: "comment",
    author: "MetaSlave",
    avatar: "https://i.pravatar.cc/150?u=meta",
    date: "5h ago",
    title: "Comment on: 'Weapon Balance Update'",
    content: "完全同意。在噩梦难度下这根本没法玩。开发人员显然不玩他们自己的游戏。",
    translatedContent: "Totally agree. It's useless now in Nightmare difficulty. Devs clearly don't play their own game.",
    sentiment: 2.5,
    relevance: 7.8,
    likes: 89,
    comments: 14,
    folder: "inbox",
    read: true,
    category: "Balancing",
    tags: ["Nightmare", "Feedback"],
    isTranslated: true,
    originalLang: "ZH"
  }
];

const FOLDERS = [
  { id: "inbox", label: "Inbox", icon: Inbox, count: 12 },
  { id: "bugs", label: "Bugs", icon: AlertTriangle, count: 5 },
  { id: "suggestions", label: "Ideas", icon: Lightbulb, count: 8 },
  { id: "toxic", label: "Moderation", icon: Trash2, count: 2 },
];

const AI_WORKSPACES = [
  { id: "monday_brief", label: "Monday Critical", count: 3, type: "ai" },
  { id: "campaign_v14", label: "v1.4 Feedback", count: 45, type: "custom" },
];

export default function TheHub() {
  const { hubViewMode } = useAppContext();
  const [selectedMessage, setSelectedMessage] = useState<any>(MESSAGES[0]);
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isContextOpen, setContextOpen] = useState(true);

  if (hubViewMode === "legacy") {
    return <TheHubLegacy />;
  }

  const renderSourceIcon = (source: string) => {
    switch(source) {
      case "Steam": return <Gamepad2 className="w-3.5 h-3.5 text-[#1b2838]" />;
      case "Discord": return <Users className="w-3.5 h-3.5 text-[#5865F2]" />;
      case "Reddit": return <MessageCircle className="w-3.5 h-3.5 text-[#FF4500]" />;
      case "YouTube": return <Youtube className="w-3.5 h-3.5 text-red-600" />;
      default: return <MessageSquare className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="flex h-full overflow-hidden bg-white">
      
      {/* 1. COLLAPSIBLE NAV SIDEBAR */}
      <div className={cn("bg-slate-50 border-r border-slate-200 flex flex-col transition-all duration-300 ease-in-out shrink-0", isSidebarCollapsed ? "w-20" : "w-64")}>
        <div className={cn("p-4 flex items-center", isSidebarCollapsed ? "justify-center" : "justify-between")}>
          {!isSidebarCollapsed && (
            <Button className="flex-1 justify-start gap-2 bg-slate-900 text-white shadow-sm hover:bg-slate-800 mr-2 overflow-hidden animate-in fade-in" size="sm">
              <Plus className="w-4 h-4 shrink-0" /> <span className="truncate">New Workspace</span>
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600" onClick={() => setSidebarCollapsed(!isSidebarCollapsed)}>
            {isSidebarCollapsed ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-4 h-4" />}
          </Button>
        </div>
        
        <ScrollArea className="flex-1 px-3">
          <div className="space-y-8 mt-4">
            <div className="space-y-2">
              {!isSidebarCollapsed && <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-3 mb-4">Smart Folders</p>}
              {FOLDERS.map(folder => (
                <button key={folder.id} className={cn("w-full flex items-center rounded-xl transition-all duration-200 group relative", isSidebarCollapsed ? "justify-center h-10 hover:bg-white hover:shadow-sm" : "justify-between px-3 py-2.5 text-slate-600 hover:bg-slate-200/50")}>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <folder.icon className={cn("text-slate-400 group-hover:text-slate-900 transition-colors shrink-0", isSidebarCollapsed ? "w-5 h-5" : "w-4 h-4")} />
                      {isSidebarCollapsed && folder.count > 0 && <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-blue-600 text-[8px] font-black text-white ring-2 ring-slate-50">{folder.count > 9 ? "9+" : folder.count}</span>}
                    </div>
                    {!isSidebarCollapsed && <span className="text-sm font-semibold truncate">{folder.label}</span>}
                  </div>
                  {!isSidebarCollapsed && folder.count > 0 && <span className="text-[10px] font-black bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full shrink-0">{folder.count}</span>}
                </button>
              ))}
            </div>
            <div className="space-y-2">
              {!isSidebarCollapsed && <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-3 mb-4">Workspaces</p>}
              {AI_WORKSPACES.map(ws => (
                <button key={ws.id} className={cn("w-full flex items-center rounded-xl transition-all duration-200 group relative", isSidebarCollapsed ? "justify-center h-10 hover:bg-purple-50 hover:shadow-sm" : "justify-between px-3 py-2.5 text-slate-600 hover:bg-purple-50")}>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      {ws.type === "ai" ? <Sparkles className={cn("text-purple-500 shrink-0", isSidebarCollapsed ? "w-5 h-5" : "w-4 h-4")} /> : <History className={cn("text-slate-400 group-hover:text-slate-900 shrink-0", isSidebarCollapsed ? "w-5 h-5" : "w-4 h-4")} />}
                      {isSidebarCollapsed && ws.count > 0 && <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-purple-600 text-[8px] font-bold text-white ring-2 ring-slate-50">{ws.count > 9 ? "9+" : ws.count}</span>}
                    </div>
                    {!isSidebarCollapsed && <span className="text-sm font-semibold truncate group-hover:text-purple-900">{ws.label}</span>}
                  </div>
                  {!isSidebarCollapsed && <span className="text-[10px] font-black text-slate-400 group-hover:text-purple-600 shrink-0">{ws.count}</span>}
                </button>
              ))}
            </div>
          </div>
        </ScrollArea>
      </div>

      {/* 2. THREAD LIST (Rich Data Restored) */}
      <div className="w-[380px] 2xl:w-[450px] border-r border-slate-200 bg-white flex flex-col shrink-0">
        <div className="p-4 border-b border-slate-100 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input className="pl-9 bg-slate-50 border-none h-9 rounded-lg focus-visible:ring-1 text-sm" placeholder="Search threads..." />
          </div>
          <Button variant="ghost" size="icon" className="h-9 w-9 border border-slate-100"><Filter className="w-4 h-4 text-slate-400" /></Button>
        </div>
        <ScrollArea className="flex-1">
          {MESSAGES.map(msg => (
            <div key={msg.id} onClick={() => setSelectedMessage(msg)} className={cn("p-4 border-b border-slate-50 cursor-pointer hover:bg-slate-50/80 transition-colors relative group", selectedMessage?.id === msg.id ? "bg-blue-50/30" : "")}>
              {/* Top Meta: Source, Channel, Icons */}
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 px-1.5 py-0.5 bg-slate-100 rounded text-[9px] font-black text-slate-600 border border-slate-200 uppercase">
                    {renderSourceIcon(msg.source)}
                    <span className="truncate max-w-[70px]">{msg.channel}</span>
                  </div>
                  {msg.pinned && <Pin className="w-3 h-3 text-orange-500 fill-orange-500" />}
                  {msg.isTranslated && (
                    <div className="flex items-center gap-1 px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded text-[9px] font-black border border-blue-100 uppercase">
                      <Languages className="w-3 h-3" /> {msg.originalLang}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] font-black text-slate-400 uppercase leading-none">Rel.</span>
                    <span className={cn("text-[11px] font-bold mt-0.5", msg.relevance > 8 ? "text-emerald-600" : "text-slate-600")}>{msg.relevance}</span>
                  </div>
                  <div className="flex flex-col items-end border-l border-slate-100 pl-3">
                    <span className="text-[10px] font-black text-slate-400 uppercase leading-none">Sent.</span>
                    <span className={cn("text-[11px] font-bold mt-0.5", msg.sentiment > 7 ? "text-emerald-600" : msg.sentiment < 4 ? "text-red-600" : "text-amber-600")}>{msg.sentiment}</span>
                  </div>
                </div>
              </div>

              {/* Title & Preview Content (Fixed Translation bug) */}
              <h4 className={cn("text-sm text-slate-900 mb-1 leading-snug truncate", !msg.read ? "font-bold" : "font-semibold")}>
                {msg.title}
              </h4>
              <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-3">
                {msg.isTranslated ? msg.translatedContent : msg.content}
              </p>

              {/* Footer Meta: Category, Tags, Likes, Date */}
              <div className="flex items-center justify-between mt-auto">
                <div className="flex items-center gap-1.5 overflow-hidden pr-2">
                  <span className={cn(
                    "text-[9px] font-black px-1.5 py-0.5 rounded border uppercase shrink-0",
                    msg.category === "Bug" ? "bg-red-50 text-red-600 border-red-100" : "bg-slate-50 text-slate-600 border-slate-200"
                  )}>{msg.category}</span>
                  <div className="flex gap-1 overflow-hidden">
                    {msg.tags?.map((tag: string) => (
                      <span key={tag} className="text-[9px] px-1.5 py-0.5 bg-slate-50 text-slate-400 rounded font-bold border border-slate-100 whitespace-nowrap">{tag}</span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-2">
                  <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                    <ThumbsUp className="w-3 h-3" /> {msg.likes > 999 ? (msg.likes/1000).toFixed(1)+'k' : msg.likes}
                  </div>
                  <span className="text-[9px] font-bold text-slate-300 uppercase tracking-tighter">{msg.date}</span>
                </div>
              </div>
            </div>
          ))}
        </ScrollArea>
      </div>

      {/* 3. MAIN VIEW */}
      <div className="flex-1 flex flex-col relative min-w-0 bg-slate-50/30">
        <div className="h-16 border-b border-slate-200 bg-white flex justify-between items-center px-6 shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            <Avatar className="w-8 h-8 border border-slate-200 shrink-0"><AvatarImage src={selectedMessage.avatar} /><AvatarFallback>IG</AvatarFallback></Avatar>
            <div className="min-w-0"><h2 className="text-sm font-bold text-slate-900 truncate">{selectedMessage.author}</h2><p className="text-xs text-slate-500 flex items-center gap-1 truncate">via {selectedMessage.source} <span className="text-slate-300">•</span> {selectedMessage.channel}</p></div>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button variant="ghost" size="sm" className="hidden lg:flex"><CheckCircle2 className="w-4 h-4 mr-2" /> Resolve</Button>
            <Button variant="ghost" size="icon" onClick={() => setContextOpen(!isContextOpen)} className={cn("transition-colors", isContextOpen ? "bg-slate-100 text-slate-900" : "text-slate-400")}><PanelRightClose className="w-4 h-4" /></Button>
          </div>
        </div>
        <ScrollArea className="flex-1 p-8">
          <div className="max-w-3xl mx-auto space-y-6 pb-32">
            {selectedMessage.type === "video" && <div className="aspect-video bg-black rounded-xl overflow-hidden shadow-sm"><img src={selectedMessage.thumbnail} className="w-full h-full object-cover opacity-90" /></div>}
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm relative">
              {selectedMessage.isTranslated && (
                <div className="absolute top-6 right-6 flex items-center gap-1 text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full border border-blue-100">
                  <Languages className="w-3 h-3" /> Translated from {selectedMessage.originalLang}
                </div>
              )}
              <h1 className="text-2xl font-black tracking-tight text-slate-900 mb-6 pr-20">{selectedMessage.title}</h1>
              <p className="text-base text-slate-700 leading-relaxed whitespace-pre-wrap">{selectedMessage.isTranslated ? selectedMessage.translatedContent : selectedMessage.content}</p>
              {selectedMessage.isTranslated && (
                <div className="mt-6 pt-6 border-t border-slate-100 text-slate-400">
                  <p className="text-[10px] font-bold uppercase mb-2">Original Content</p>
                  <p className="text-sm italic">"{selectedMessage.content}"</p>
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
        {/* Reply Drawer */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4">
          {!isReplying ? (
            <button onClick={() => setIsReplying(true)} className="w-full bg-white border border-slate-200 shadow-xl rounded-full h-12 flex items-center px-4 text-sm text-slate-400 hover:border-blue-400 hover:text-slate-600 transition-all cursor-text group"><Reply className="w-4 h-4 mr-3 text-slate-300 group-hover:text-blue-500" />Reply to {selectedMessage.author}...</button>
          ) : (
            <div className="bg-white border border-slate-200 shadow-2xl rounded-[2rem] p-6 animate-in slide-in-from-bottom-4 zoom-in-95 duration-200">
              <div className="flex justify-between items-center mb-4"><span className="text-xs font-black text-slate-400 uppercase tracking-widest">Drafting reply</span><Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsReplying(false)}><X className="w-3 h-3" /></Button></div>
              <Textarea autoFocus placeholder="Type your message..." className="min-h-[120px] border-none shadow-none resize-none text-base p-0 focus-visible:ring-0" value={replyText} onChange={(e) => setReplyText(e.target.value)} />
              <div className="flex justify-between items-center pt-4 mt-2 border-t border-slate-50">
                <Button variant="ghost" size="sm" className="h-8 text-xs bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-full font-bold"><Sparkles className="w-3.5 h-3.5 mr-1.5" /> A.D.A Enhance</Button>
                <Button size="sm" className="h-10 bg-slate-900 hover:bg-black gap-2 px-6 rounded-full font-bold"><Send className="w-3.5 h-3.5" /> Send Reply</Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4. CONTEXT SIDEBAR */}
      {isContextOpen && (
        <div className="w-80 border-l border-slate-200 bg-white flex flex-col shrink-0 animate-in slide-in-from-right-10 duration-300">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center"><h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Team Context</h3><Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setContextOpen(false)}><X className="w-3 h-3 text-slate-400" /></Button></div>
          <ScrollArea className="flex-1 p-6 space-y-8">
            <div className="space-y-4">
              <p className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2"><MessageSquare className="w-4 h-4 text-blue-500" /> Internal Chat</p>
              <div className="bg-yellow-50 p-4 rounded-2xl border border-yellow-100 text-xs text-yellow-800 leading-relaxed shadow-sm">Influencer detected. Tone: Constructive but critical.</div>
              <div className="flex gap-2"><Input className="h-9 text-xs bg-slate-50 rounded-xl" placeholder="Add note..." /><Button size="icon" className="h-9 w-9 shrink-0 bg-slate-100 text-slate-600 rounded-xl"><Send className="w-3.5 h-3.5" /></Button></div>
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
