import { useState } from "react";
import { 
  Gamepad2, MessageCircle, Users, Youtube, 
  Search, Filter, MoreHorizontal, MessageSquare, 
  ThumbsUp, Languages, Star, Info, X, 
  Eye, CheckCircle2, CornerDownRight, Send,
  Bookmark, Flag, ExternalLink
} from "lucide-react";
import { cn } from "@repo/ui/lib/utils.ts";
import { Button } from "@repo/ui/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/components/ui/avatar";
import { ScrollArea, ScrollBar } from "@repo/ui/components/ui/scroll-area";
import { Input } from "@repo/ui/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/ui/components/ui/tabs";

// --- MOCK DATA ---
const PLATFORMS = [
  { id: "steam", name: "Steam", icon: Gamepad2, color: "#1b2838" },
  { id: "discord", name: "Discord", icon: Users, color: "#5865F2" },
  { id: "reddit", name: "Reddit", icon: MessageCircle, color: "#FF4500" },
  { id: "youtube", name: "YouTube", icon: Youtube, color: "#FF0000" },
];

const MOCK_MESSAGES: any[] = [
  {
    id: 1,
    platform: "steam",
    author: "GamerPro",
    avatar: "https://i.pravatar.cc/150?u=1",
    content: "Cette nouvelle mise à jour est incroyable, j'adore le nouveau boss ! Le combat est très fluide.",
    isTranslated: true,
    originalLang: "FR",
    translatedContent: "This new update is amazing, I love the new boss! The combat is very smooth.",
    date: "2h ago",
    relevance: 9.5,
    sentiment: 8.8,
    comments: [
      { author: "Dev_Tom", content: "Glad you liked it! We spent a lot of time on the hitbox.", date: "1h ago" }
    ],
    likes: 45,
    channel: "Reviews",
    isImportant: true,
    isFollowed: false,
    internalNotes: "Great candidate for a social media spotlight.",
    internalChat: [
      { user: "Sarah", content: "Should we share this on Twitter?", time: "1h ago" }
    ]
  },
  {
    id: 2,
    platform: "discord",
    author: "Admin_Mike",
    avatar: "https://i.pravatar.cc/150?u=2",
    content: "Can someone check the server status in EU? Getting some lag reports.",
    isTranslated: false,
    date: "10m ago",
    relevance: 7.0,
    sentiment: 5.0,
    comments: [],
    likes: 2,
    channel: "#general",
    isImportant: false,
    isFollowed: true,
    internalNotes: "Checking with Ops team.",
    internalChat: []
  }
];

export function TheHubLegacy() {
  const [selectedMsg, setSelectedMsg] = useState<any>(null);

  const MessageCard = ({ msg }: { msg: any }) => (
    <div 
      onClick={() => setSelectedMsg(msg)}
      className={cn(
        "bg-white border rounded-xl p-4 shadow-sm hover:shadow-md transition-all space-y-3 relative group cursor-pointer",
        selectedMsg?.id === msg.id ? "border-blue-500 ring-1 ring-blue-500" : "border-slate-200"
      )}
    >
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2">
          <Avatar className="w-7 h-7 border border-slate-100">
            <AvatarFallback>{msg.author[0]}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-slate-900 truncate">{msg.author}</p>
            <p className="text-[9px] text-slate-400 font-medium uppercase tracking-tighter">{msg.date} • {msg.channel}</p>
          </div>
        </div>
        <div className="flex gap-1">
          {msg.isImportant && <Star className="w-3 h-3 fill-amber-500 text-amber-500" />}
          {msg.isFollowed && <Eye className="w-3 h-3 text-blue-500" />}
        </div>
      </div>

      <p className="text-xs text-slate-700 leading-relaxed line-clamp-3">
        {msg.isTranslated ? msg.translatedContent : msg.content}
      </p>

      <div className="pt-3 border-t border-slate-50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-center">
            <p className="text-[8px] font-black text-slate-400 uppercase leading-none">Rel.</p>
            <p className="text-[10px] font-bold text-slate-700">{msg.relevance}</p>
          </div>
          <div className="text-center">
            <p className="text-[8px] font-black text-slate-400 uppercase leading-none">Sent.</p>
            <p className={cn("text-[10px] font-bold", msg.sentiment > 7 ? "text-emerald-600" : "text-amber-600")}>{msg.sentiment}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold">
          <div className="flex items-center gap-1"><MessageSquare className="w-3 h-3" /> {msg.comments.length}</div>
          <div className="flex items-center gap-1"><ThumbsUp className="w-3 h-3" /> {msg.likes}</div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-full flex relative bg-slate-50/50 overflow-hidden">
      <ScrollArea className="flex-1 h-full w-full">
        <div className="flex gap-4 p-6 min-w-max h-full">
          {PLATFORMS.map(platform => (
            <div key={platform.id} className="w-72 flex flex-col gap-4 shrink-0">
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-white border border-slate-200 shadow-sm" style={{ color: platform.color }}>
                    <platform.icon className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">{platform.name}</h3>
                </div>
                <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">
                  {MOCK_MESSAGES.filter(m => m.platform === platform.id).length}
                </span>
              </div>

              <div className="flex-1 space-y-3 pb-10">
                {MOCK_MESSAGES.filter(m => m.platform === platform.id).map(msg => (
                  <MessageCard key={msg.id} msg={msg} />
                ))}
              </div>
            </div>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {/* DETAIL DRAWER (Overlay on the right) */}
      {selectedMsg && (
        <div className="w-[450px] bg-white border-l border-slate-200 shadow-2xl flex flex-col animate-in slide-in-from-right-full duration-300 z-50">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => setSelectedMsg(null)}><X className="w-4 h-4" /></Button>
              <h2 className="text-sm font-bold uppercase tracking-widest text-slate-900">Message Detail</h2>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" className={cn(selectedMsg.isImportant && "text-amber-500")}><Bookmark className="w-4 h-4" /></Button>
              <Button variant="ghost" size="icon" className={cn(selectedMsg.isFollowed && "text-blue-500")}><Eye className="w-4 h-4" /></Button>
            </div>
          </div>

          <ScrollArea className="flex-1 p-6">
            <div className="space-y-8">
              {/* Content Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10 border border-slate-100 shadow-sm">
                    <AvatarFallback>{selectedMsg.author[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-bold text-slate-900">{selectedMsg.author}</p>
                    <p className="text-xs text-slate-500">{selectedMsg.date} on {selectedMsg.platform}</p>
                  </div>
                </div>
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 relative">
                  <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
                    {selectedMsg.isTranslated ? selectedMsg.translatedContent : selectedMsg.content}
                  </p>
                  {selectedMsg.isTranslated && (
                    <div className="mt-4 pt-4 border-t border-slate-200">
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-2 flex items-center gap-2">
                        <Languages className="w-3.5 h-3.5" /> Original Content ({selectedMsg.originalLang})
                      </p>
                      <p className="text-xs text-slate-500 italic">"{selectedMsg.content}"</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Internal Note Section */}
              <div className="space-y-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Personal Note</p>
                <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 text-sm text-slate-700">
                  {selectedMsg.internalNotes || "No personal note added."}
                </div>
              </div>

              {/* Tabs for Interaction */}
              <Tabs defaultValue="comments" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-slate-100/50 rounded-lg p-1">
                  <TabsTrigger value="comments" className="text-xs font-bold">Public Replies ({selectedMsg.comments.length})</TabsTrigger>
                  <TabsTrigger value="internal" className="text-xs font-bold">Internal Discussion</TabsTrigger>
                </TabsList>
                
                <TabsContent value="comments" className="pt-4 space-y-4">
                  {selectedMsg.comments.map((c: any, i: number) => (
                    <div key={i} className="flex gap-3 p-3 bg-white border border-slate-100 rounded-xl">
                      <div className="w-1 h-8 bg-slate-200 rounded-full shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-slate-900">{c.author} <span className="font-normal text-slate-400 ml-2">{c.date}</span></p>
                        <p className="text-xs text-slate-600 mt-1">{c.content}</p>
                      </div>
                    </div>
                  ))}
                  {selectedMsg.comments.length === 0 && <p className="text-center py-10 text-xs text-slate-400 italic">No public comments yet.</p>}
                </TabsContent>

                <TabsContent value="internal" className="pt-4 space-y-4">
                  {selectedMsg.internalChat.map((chat: any, i: number) => (
                    <div key={i} className="flex gap-3 items-start">
                      <Avatar className="w-6 h-6 shrink-0"><AvatarFallback>{chat.user[0]}</AvatarFallback></Avatar>
                      <div className="bg-slate-100 p-3 rounded-2xl rounded-tl-none text-xs text-slate-700">
                        <span className="font-bold block mb-1">{chat.user}</span>
                        {chat.content}
                      </div>
                    </div>
                  ))}
                  <div className="flex gap-2 mt-4">
                    <Input className="h-9 text-xs" placeholder="Add internal message..." />
                    <Button size="icon" className="h-9 w-9 bg-slate-900 shrink-0"><Send className="w-3.5 h-3.5" /></Button>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </ScrollArea>

          {/* Action Footer */}
          <div className="p-4 border-t border-slate-100 bg-white">
            <Button className="w-full bg-blue-600 hover:bg-blue-700 gap-2">
              <ExternalLink className="w-4 h-4" /> Open on {selectedMsg.platform}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}