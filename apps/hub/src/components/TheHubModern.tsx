import { useState } from "react";
import { 
  Inbox, AlertTriangle, Lightbulb, Trash2, Search, Filter,
  MoreHorizontal, Reply, Sparkles, Gamepad2, MessageCircle, Users,
  Youtube, Pin, CheckCircle2, MessageSquare, Video, CornerDownRight,
  Plus, History, UserPlus, Send, X, ExternalLink, Languages,
  Tag, PanelLeftClose, PanelLeftOpen, PanelRightOpen, PanelRightClose,
  Info
} from "lucide-react";
import { cn } from "@repo/ui/lib/utils.ts";
import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/components/ui/avatar";
import { Textarea } from "@repo/ui/components/ui/textarea";
import { ScrollArea } from "@repo/ui/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/ui/components/ui/tabs";

// --- MOCK DATA ---
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
    sentiment: "Neutral",
    relevance: 9.2,
    folder: "inbox",
    read: false,
    tags: ["Review", "Gameplay"],
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
    sentiment: "Negative",
    relevance: 8.5,
    folder: "bugs",
    read: false,
    pinned: true,
    tags: ["Bug", "Steam Deck"],
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
    sentiment: "Negative",
    relevance: 6.0,
    folder: "inbox",
    read: true,
    tags: ["Balancing"],
    isTranslated: true,
    originalLang: "ZH"
  }
];

const INTERNAL_NOTES = [
  { user: "Sarah (CM)", text: "I'll handle the YouTube comment, we can offer him a key for a giveaway.", time: "1h ago" },
  { user: "Mike (Dev)", text: "Checking the video timestamp 4:20, he mentions a hitbox bug.", time: "30m ago" }
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

export function TheHubModern() {
  const [selectedMessage, setSelectedMessage] = useState<any>(MESSAGES[0]);
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isContextOpen, setContextOpen] = useState(true);

  const filteredMessages = MESSAGES.filter(m => true); // Mock filter

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
      <div 
        className={cn(
          "bg-slate-50 border-r border-slate-200 flex flex-col transition-all duration-300 ease-in-out shrink-0",
          isSidebarCollapsed ? "w-20" : "w-64"
        )}
      >
        <div className={cn("p-4 flex items-center", isSidebarCollapsed ? "justify-center" : "justify-between")}>
          {!isSidebarCollapsed && (
            <Button className="flex-1 justify-start gap-2 bg-slate-900 text-white shadow-sm hover:bg-slate-800 mr-2 overflow-hidden animate-in fade-in zoom-in-95 duration-300" size="sm">
              <Plus className="w-4 h-4 shrink-0" /> <span className="truncate">New Workspace</span>
            </Button>
          )}
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-slate-400 hover:text-slate-600"
            onClick={() => setSidebarCollapsed(!isSidebarCollapsed)}
          >
            {isSidebarCollapsed ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-4 h-4" />}
          </Button>
        </div>
        
        <ScrollArea className="flex-1 px-3">
          <div className="space-y-8 mt-4">
            {/* Folders Group */}
            <div className="space-y-2">
              {!isSidebarCollapsed && <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-3 mb-4 animate-in fade-in">Smart Folders</p>}
              {FOLDERS.map(folder => (
                <button 
                  key={folder.id} 
                  className={cn(
                    "w-full flex items-center rounded-xl transition-all duration-200 group relative",
                    isSidebarCollapsed ? "justify-center h-12 hover:bg-white hover:shadow-sm" : "justify-between px-3 py-2.5 text-slate-600 hover:bg-slate-200/50"
                  )}
                  title={isSidebarCollapsed ? folder.label : undefined}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <folder.icon className={cn(
                        "text-slate-400 group-hover:text-slate-900 transition-colors shrink-0",
                        isSidebarCollapsed ? "w-5 h-5" : "w-4 h-4"
                      )} />
                      {isSidebarCollapsed && folder.count > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[9px] font-black text-white shadow-sm ring-2 ring-slate-50">
                          {folder.count > 9 ? "9+" : folder.count}
                        </span>
                      )}
                    </div>
                    {!isSidebarCollapsed && <span className="text-sm font-semibold truncate">{folder.label}</span>}
                  </div>
                  {!isSidebarCollapsed && folder.count > 0 && (
                    <span className="text-[10px] font-black bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full shrink-0">
                      {folder.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Workspaces Group */}
            <div className="space-y-2">
              {!isSidebarCollapsed && <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-3 mb-4 animate-in fade-in">Workspaces</p>}
              {AI_WORKSPACES.map(ws => (
                <button 
                  key={ws.id} 
                  className={cn(
                    "w-full flex items-center rounded-xl transition-all duration-200 group relative",
                    isSidebarCollapsed ? "justify-center h-12 hover:bg-purple-50 hover:shadow-sm" : "justify-between px-3 py-2.5 text-slate-600 hover:bg-purple-50"
                  )}
                  title={isSidebarCollapsed ? ws.label : undefined}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      {ws.type === "ai" ? (
                        <Sparkles className={cn("text-purple-500 shrink-0", isSidebarCollapsed ? "w-5 h-5" : "w-4 h-4")} />
                      ) : (
                        <History className={cn("text-slate-400 group-hover:text-slate-900 shrink-0", isSidebarCollapsed ? "w-5 h-5" : "w-4 h-4")} />
                      )}
                      {isSidebarCollapsed && ws.count > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-purple-600 text-[9px] font-black text-white shadow-sm ring-2 ring-slate-50">
                          {ws.count > 9 ? "9+" : ws.count}
                        </span>
                      )}
                    </div>
                    {!isSidebarCollapsed && <span className="text-sm font-semibold truncate group-hover:text-purple-900">{ws.label}</span>}
                  </div>
                  {!isSidebarCollapsed && (
                    <span className="text-[10px] font-black text-slate-400 group-hover:text-purple-600 shrink-0">
                      {ws.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </ScrollArea>
      </div>

      {/* 2. THREAD LIST (Fixed: Rich Metadata Restored) */}
      <div className="w-[320px] 2xl:w-[420px] border-r border-slate-200 bg-white flex flex-col shrink-0">
        <div className="p-4 border-b border-slate-100 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input className="pl-9 bg-slate-50 border-none h-9 rounded-lg focus-visible:ring-1 text-sm" placeholder="Search..." />
          </div>
          <Button variant="ghost" size="icon" className="h-9 w-9 border border-slate-100"><Filter className="w-4 h-4 text-slate-400" /></Button>
        </div>
        <ScrollArea className="flex-1">
          {filteredMessages.map(msg => (
            <div 
              key={msg.id}
              onClick={() => setSelectedMessage(msg)}
              className={cn(
                "p-4 border-b border-slate-50 cursor-pointer hover:bg-slate-50/80 transition-colors relative group",
                selectedMessage?.id === msg.id ? "bg-blue-50/30" : ""
              )}
            >
              {/* Meta Header */}
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 px-1.5 py-0.5 bg-slate-100 rounded text-[10px] font-bold text-slate-600 border border-slate-200">
                    {renderSourceIcon(msg.source)}
                    <span className="truncate max-w-[80px]">{msg.channel}</span>
                  </div>
                  {msg.pinned && <Pin className="w-3 h-3 text-orange-500 fill-orange-500" />}
                  {msg.isTranslated && (
                    <div className="flex items-center gap-1 px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px] font-bold border border-blue-100" title={`Translated from ${msg.originalLang}`}>
                      <Languages className="w-3 h-3" />
                      {msg.originalLang}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "text-[10px] font-bold",
                    msg.relevance > 8 ? "text-emerald-600" : "text-slate-400"
                  )}>
                    {msg.relevance}/10
                  </span>
                  <span className="text-[10px] text-slate-400">{msg.date}</span>
                </div>
              </div>

              {/* Title & Preview */}
              <h4 className={cn("text-sm text-slate-900 mb-1 leading-snug", !msg.read ? "font-bold" : "font-medium")}>
                {msg.title}
              </h4>
              <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                {msg.isTranslated ? msg.translatedContent : msg.content}
              </p>

              {/* Tags & Badges (Restored) */}
              <div className="flex items-center gap-2 mt-3 overflow-hidden">
                {msg.tags?.map((tag: string) => (
                  <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded font-medium border border-slate-200 whitespace-nowrap">
                    {tag}
                  </span>
                ))}
                
                {msg.type === "video" && <span className="ml-auto text-[10px] bg-red-50 text-red-600 px-1.5 rounded flex items-center gap-1 shrink-0"><Video className="w-3 h-3" /> Video</span>}
              </div>
            </div>
          ))}
        </ScrollArea>
      </div>

      {/* 3. MAIN VIEW + REPLY DRAWER */}
      <div className="flex-1 flex flex-col relative min-w-0 bg-slate-50/30">
        <div className="h-16 border-b border-slate-200 bg-white flex justify-between items-center px-6 shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            <Avatar className="w-8 h-8 border border-slate-200 shrink-0">
              <AvatarImage src={selectedMessage.avatar} />
              <AvatarFallback>IG</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-slate-900 truncate">{selectedMessage.author}</h2>
              <p className="text-xs text-slate-500 flex items-center gap-1 truncate">
                via {selectedMessage.source} <span className="text-slate-300">•</span> {selectedMessage.channel}
              </p>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button variant="ghost" size="sm" className="hidden lg:flex"><CheckCircle2 className="w-4 h-4 mr-2" /> Resolve</Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setContextOpen(!isContextOpen)}
              className={cn("transition-colors", isContextOpen ? "bg-slate-100 text-slate-900" : "text-slate-400")}
            >
              {isContextOpen ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        <ScrollArea className="flex-1 p-8">
          <div className="max-w-3xl mx-auto space-y-6 pb-32">
            {selectedMessage.type === "video" && (
              <div className="aspect-video bg-black rounded-xl overflow-hidden shadow-sm">
                <img src={selectedMessage.thumbnail} className="w-full h-full object-cover opacity-90" />
              </div>
            )}
            
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm relative">
              {selectedMessage.isTranslated && (
                <div className="absolute top-6 right-6 flex items-center gap-1 text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full border border-blue-100">
                  <Languages className="w-3 h-3" /> Translated from {selectedMessage.originalLang}
                </div>
              )}
              <h1 className="text-2xl font-black tracking-tight text-slate-900 mb-6 pr-20">{selectedMessage.title}</h1>
              <p className="text-base text-slate-700 leading-relaxed whitespace-pre-wrap">
                {selectedMessage.isTranslated ? selectedMessage.translatedContent : selectedMessage.content}
              </p>
              {selectedMessage.isTranslated && (
                <div className="mt-6 pt-6 border-t border-slate-100 text-slate-400">
                  <p className="text-[10px] font-bold uppercase mb-2">Original Content</p>
                  <p className="text-sm italic">"{selectedMessage.content}"</p>
                </div>
              )}
            </div>

            <div className="pl-8 border-l-2 border-slate-200 space-y-4">
              <div className="flex gap-3">
                <Avatar className="w-6 h-6"><AvatarFallback>U1</AvatarFallback></Avatar>
                <div className="bg-white p-3 rounded-xl rounded-tl-none border border-slate-200 shadow-sm text-xs text-slate-600">
                  <p>Totally agree with the co-op part!</p>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* Reply Bar */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4">
          {!isReplying ? (
            <button 
              onClick={() => setIsReplying(true)}
              className="w-full bg-white border border-slate-200 shadow-xl rounded-full h-12 flex items-center px-4 text-sm text-slate-400 hover:border-blue-400 hover:text-slate-600 transition-all cursor-text group"
            >
              <Reply className="w-4 h-4 mr-3 text-slate-300 group-hover:text-blue-500" />
              Reply to {selectedMessage.author}...
            </button>
          ) : (
            <div className="bg-white border border-slate-200 shadow-2xl rounded-[2rem] p-6 animate-in slide-in-from-bottom-4 zoom-in-95 duration-200">
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Drafting reply</span>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsReplying(false)}><X className="w-3 h-3" /></Button>
              </div>
              <Textarea 
                autoFocus
                placeholder="Type your message..."
                className="min-h-[120px] border-none shadow-none resize-none text-base p-0 focus-visible:ring-0"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
              />
              <div className="flex justify-between items-center pt-4 mt-2 border-t border-slate-50">
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" className="h-8 text-xs bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-full font-bold">
                    <Sparkles className="w-3.5 h-3.5 mr-1.5" /> A.D.A Enhance
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="h-10 bg-slate-900 hover:bg-black gap-2 px-6 rounded-full font-bold">
                    <Send className="w-3.5 h-3.5" /> Send Reply
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4. CONTEXT SIDEBAR */}
      {isContextOpen && (
        <div className="w-80 border-l border-slate-200 bg-white flex flex-col shrink-0 animate-in slide-in-from-right-10 duration-300">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Team Context</h3>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setContextOpen(false)}>
              <X className="w-3 h-3 text-slate-400" />
            </Button>
          </div>
          <ScrollArea className="flex-1 p-6 space-y-8">
            <div className="space-y-4">
              <p className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-blue-500" /> Internal Chat
              </p>
              <div className="bg-yellow-50 p-4 rounded-2xl border border-yellow-100 text-xs text-yellow-800 leading-relaxed shadow-sm">
                <span className="font-black block mb-1">@Sarah (CM)</span>
                Influencer detected. Tone: Constructive but critical.
              </div>
              <div className="flex gap-2">
                <Input className="h-9 text-xs bg-slate-50 rounded-xl" placeholder="Add note..." />
                <Button size="icon" className="h-9 w-9 shrink-0 bg-slate-100 text-slate-600 rounded-xl"><Send className="w-3.5 h-3.5" /></Button>
              </div>
            </div>

            <div className="space-y-4 pt-6 border-t border-slate-100">
              <p className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-500" /> User Profile
              </p>
              <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <Avatar className="w-12 h-12 border-2 border-white shadow-sm"><AvatarFallback>IG</AvatarFallback></Avatar>
                <div>
                  <p className="text-sm font-black text-slate-900">IronGamer</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">12k Subscribers</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div className="p-2 bg-slate-50 rounded text-center">
                  <span className="block text-[10px] text-slate-400 uppercase">Sentiment</span>
                  <span className="text-xs font-bold text-emerald-600">Positive</span>
                </div>
                <div className="p-2 bg-slate-50 rounded text-center">
                  <span className="block text-[10px] text-slate-400 uppercase">History</span>
                  <span className="text-xs font-bold text-slate-700">5 posts</span>
                </div>
              </div>
            </div>

          </ScrollArea>
        </div>
      )}

    </div>
  );
}
