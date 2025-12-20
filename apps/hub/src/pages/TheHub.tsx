import { useState } from "react";
import { 
  Inbox, AlertTriangle, Lightbulb, Trash2, Search, Filter,
  MoreHorizontal, Reply, Sparkles, Gamepad2, MessageCircle, Users,
  Youtube, Pin, CheckCircle2, MessageSquare, Video, CornerDownRight,
  Plus, History, UserPlus, Send, X, ExternalLink
} from "lucide-react";
import { cn } from "@repo/ui/lib/utils.ts";
import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/components/ui/avatar";
import { Textarea } from "@repo/ui/components/ui/textarea";
import { ScrollArea } from "@repo/ui/components/ui/scroll-area";

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
    folder: "inbox",
    read: false
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
    folder: "bugs",
    read: false,
    pinned: true
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
  const [selectedMessage, setSelectedMessage] = useState<any>(MESSAGES[0]);
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState("");

  return (
    <div className="flex h-[calc(100vh-100px)] -m-8 overflow-hidden bg-white">
      
      {/* 1. NAV SIDEBAR */}
      <div className="w-64 bg-slate-50 border-r border-slate-200 flex flex-col">
        <div className="p-4">
          <Button className="w-full justify-start gap-2 bg-slate-900 text-white shadow-sm hover:bg-slate-800" size="lg">
            <Plus className="w-4 h-4" /> New Workspace
          </Button>
        </div>
        
        <ScrollArea className="flex-1 px-3">
          <div className="space-y-6">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-2">Smart Folders</p>
              {FOLDERS.map(folder => (
                <button key={folder.id} className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-200/50 transition-colors group">
                  <div className="flex items-center gap-3">
                    <folder.icon className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
                    {folder.label}
                  </div>
                  {folder.count > 0 && <span className="text-xs font-bold bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">{folder.count}</span>}
                </button>
              ))}
            </div>

            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-2">Workspaces</p>
              {AI_WORKSPACES.map(ws => (
                <button key={ws.id} className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-purple-50 hover:text-purple-900 transition-colors group">
                  <div className="flex items-center gap-3">
                    {ws.type === "ai" ? <Sparkles className="w-4 h-4 text-purple-500" /> : <History className="w-4 h-4 text-slate-400" />}
                    {ws.label}
                  </div>
                  <span className="text-xs font-bold text-slate-400 group-hover:text-purple-600">{ws.count}</span>
                </button>
              ))}
            </div>
          </div>
        </ScrollArea>
      </div>

      {/* 2. THREAD LIST */}
      <div className="w-[380px] border-r border-slate-200 flex flex-col bg-white">
        <div className="p-4 border-b border-slate-100 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input className="pl-9 bg-slate-50 border-none h-9 rounded-lg focus-visible:ring-1" placeholder="Search..." />
          </div>
          <Button variant="ghost" size="icon" className="h-9 w-9 border border-slate-100"><Filter className="w-4 h-4 text-slate-400" /></Button>
        </div>
        <ScrollArea className="flex-1">
          {MESSAGES.map(msg => (
            <div 
              key={msg.id}
              onClick={() => setSelectedMessage(msg)}
              className={cn(
                "p-4 border-b border-slate-50 cursor-pointer hover:bg-slate-50 transition-colors relative group",
                selectedMessage?.id === msg.id ? "bg-blue-50/30" : ""
              )}
            >
              <div className="flex justify-between items-start mb-1.5">
                <div className="flex items-center gap-2">
                  <span className={cn("w-2 h-2 rounded-full", msg.read ? "bg-transparent border border-slate-300" : "bg-blue-500")} />
                  <span className="text-xs font-bold text-slate-700">{msg.author}</span>
                </div>
                <span className="text-[10px] text-slate-400">{msg.date}</span>
              </div>
              <h4 className="text-sm font-semibold text-slate-900 mb-1 leading-snug">{msg.title}</h4>
              <p className="text-xs text-slate-500 line-clamp-2">{msg.content}</p>
              <div className="flex items-center gap-2 mt-3">
                <div className="flex items-center gap-1 text-[10px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                  {msg.source === "YouTube" ? <Youtube className="w-3 h-3" /> : <MessageCircle className="w-3 h-3" />}
                  {msg.channel}
                </div>
              </div>
            </div>
          ))}
        </ScrollArea>
      </div>

      {/* 3. MAIN VIEW + REPLY DRAWER */}
      <div className="flex-1 flex flex-col relative min-w-0 bg-slate-50/30">
        
        {/* Sticky Header */}
        <div className="h-16 border-b border-slate-200 bg-white flex justify-between items-center px-6 shrink-0">
          <div className="flex items-center gap-3">
            <Avatar className="w-8 h-8 border border-slate-200">
              <AvatarImage src={selectedMessage.avatar} />
              <AvatarFallback>IG</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-sm font-bold text-slate-900">{selectedMessage.author}</h2>
              <p className="text-xs text-slate-500 flex items-center gap-1">
                via {selectedMessage.source} <span className="text-slate-300">•</span> {selectedMessage.channel}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm"><CheckCircle2 className="w-4 h-4 mr-2" /> Resolve</Button>
            <Button variant="ghost" size="icon"><MoreHorizontal className="w-4 h-4" /></Button>
          </div>
        </div>

        {/* Content Scroll */}
        <ScrollArea className="flex-1 p-8">
          <div className="max-w-3xl mx-auto space-y-6 pb-32"> {/* Padding bottom for reply drawer */}
            {selectedMessage.type === "video" && (
              <div className="aspect-video bg-black rounded-xl overflow-hidden shadow-sm">
                <img src={selectedMessage.thumbnail} className="w-full h-full object-cover opacity-90" />
              </div>
            )}
            
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h1 className="text-xl font-bold text-slate-900 mb-4">{selectedMessage.title}</h1>
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{selectedMessage.content}</p>
            </div>

            {/* Comments Thread Mock */}
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

        {/* Floating Reply Bar (Bottom) */}
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
            <div className="bg-white border border-slate-200 shadow-2xl rounded-2xl p-4 animate-in slide-in-from-bottom-4 zoom-in-95 duration-200">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Drafting reply...</span>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsReplying(false)}><X className="w-3 h-3" /></Button>
              </div>
              <Textarea 
                autoFocus
                placeholder="Type your message..."
                className="min-h-[100px] border-none shadow-none resize-none text-sm p-0 focus-visible:ring-0"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
              />
              <div className="flex justify-between items-center pt-2 mt-2 border-t border-slate-50">
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" className="h-7 text-xs bg-purple-50 text-purple-700 hover:bg-purple-100"><Sparkles className="w-3 h-3 mr-1" /> Enhance</Button>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" className="h-8 text-xs">Save Draft</Button>
                  <Button size="sm" className="h-8 bg-blue-600 hover:bg-blue-700 gap-2">
                    <Send className="w-3.5 h-3.5" /> Send
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4. CONTEXT SIDEBAR (Collapsible Right) */}
      <div className="w-80 bg-white border-l border-slate-200 flex flex-col">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Team Context</h3>
        </div>
        <ScrollArea className="flex-1 p-4 space-y-6">
          
          {/* Internal Chat */}
          <div className="space-y-3">
            <p className="text-xs font-bold text-slate-900 flex items-center gap-2">
              <MessageSquare className="w-3.5 h-3.5" /> Internal Discussion
            </p>
            <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100 text-xs text-yellow-800">
              <span className="font-bold block mb-1">@Sarah (CM)</span>
              Warning: This user is an influencer. Please double check the tone.
            </div>
            <div className="flex gap-2 mt-2">
              <Input className="h-8 text-xs bg-slate-50" placeholder="@mention team..." />
              <Button size="icon" className="h-8 w-8 shrink-0 bg-slate-100 text-slate-600 hover:bg-slate-200"><Send className="w-3 h-3" /></Button>
            </div>
          </div>

          {/* User Info */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <p className="text-xs font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-3.5 h-3.5" /> Author Profile
            </p>
            <div className="flex items-center gap-3">
              <Avatar className="w-10 h-10 border border-slate-200"><AvatarFallback>IG</AvatarFallback></Avatar>
              <div>
                <p className="text-sm font-bold">IronGamer</p>
                <p className="text-xs text-slate-500">12k Subscribers</p>
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

    </div>
  );
}