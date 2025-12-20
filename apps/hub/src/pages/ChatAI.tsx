import { useState } from "react";
import { 
  Send, 
  Sparkles, 
  Bot, 
  User, 
  MoreHorizontal, 
  Trash2, 
  Plus, 
  MessageSquare,
  BarChart3,
  Lightbulb
} from "lucide-react";
import { cn } from "@repo/ui/lib/utils.ts";
import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/components/ui/avatar";
import { ScrollArea } from "@repo/ui/components/ui/scroll-area";

// --- MOCK DATA ---
const HISTORY = [
  { id: 1, title: "Sentiment Analysis v1.4", date: "Today" },
  { id: 2, title: "Matchmaking bug investigation", date: "Yesterday" },
  { id: 3, title: "Competitor benchmark", date: "3 days ago" },
];

const SUGGESTIONS = [
  { icon: BarChart3, label: "Graph sentiment vs sales" },
  { icon: AlertTriangle, label: "List critical bugs" },
  { icon: Lightbulb, label: "Summarize feature requests" },
];

const MOCK_MESSAGES = [
  {
    id: 1,
    role: "assistant",
    content: "Hello! I'm A.D.A, your studio intelligence copilot. I've analyzed 12.5k new signals today. What would you like to investigate?",
    type: "text"
  },
  {
    id: 2,
    role: "user",
    content: "Why is the sentiment dropping on Steam?",
    type: "text"
  },
  {
    id: 3,
    role: "assistant",
    content: "The drop correlates with the release of patch v1.4.2. I've detected a surge in keywords 'Crash' and 'Deck' in the last 4 hours.",
    type: "text",
    chart: "volume_trend" // Mock trigger for rich UI
  }
];

export default function ChatAI() {
  const [messages, setMessages] = useState(MOCK_MESSAGES);
  const [inputValue, setInputValue] = useState("");

  const handleSend = () => {
    if (!inputValue.trim()) return;
    const newMsg = { id: Date.now(), role: "user", content: inputValue, type: "text" };
    setMessages([...messages, newMsg]);
    setInputValue("");
    
    // Fake response simulation
    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: "assistant",
        content: "I'm analyzing the latest data streams... It seems related to the new weapon balancing.",
        type: "text"
      }]);
    }, 1000);
  };

  return (
    <div className="flex h-[calc(100vh-100px)] -m-8 overflow-hidden bg-white">
      
      {/* 1. SIDEBAR HISTORY */}
      <div className="w-72 bg-slate-50 border-r border-slate-200 flex flex-col">
        <div className="p-4">
          <Button className="w-full justify-start gap-2 bg-slate-900 text-white shadow-md hover:bg-slate-800" size="lg">
            <Plus className="w-4 h-4" /> New Investigation
          </Button>
        </div>
        
        <ScrollArea className="flex-1 px-3">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 mb-2 mt-2">Recent Chats</p>
          <div className="space-y-1">
            {HISTORY.map(chat => (
              <button
                key={chat.id}
                className="w-full text-left px-3 py-3 rounded-lg text-sm text-slate-600 hover:bg-slate-200/50 hover:text-slate-900 transition-colors flex items-center gap-3 group"
              >
                <MessageSquare className="w-4 h-4 text-slate-400" />
                <span className="truncate flex-1 font-medium">{chat.title}</span>
                <span className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-opacity">
                  <Trash2 className="w-3.5 h-3.5" />
                </span>
              </button>
            ))}
          </div>
        </ScrollArea>

        <div className="p-4 border-t border-slate-200">
          <div className="flex items-center gap-3 px-2">
            <Avatar className="w-8 h-8 border border-slate-200">
              <AvatarImage src="https://github.com/shadcn.png" />
              <AvatarFallback>JD</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-900 truncate">John Doe</p>
              <p className="text-xs text-slate-500 truncate">Pro Plan</p>
            </div>
            <Settings2 className="w-4 h-4 text-slate-400 cursor-pointer hover:text-slate-600" />
          </div>
        </div>
      </div>

      {/* 2. CHAT AREA */}
      <div className="flex-1 flex flex-col relative bg-white">
        
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8 scroll-smooth">
          {messages.map((msg) => (
            <div 
              key={msg.id} 
              className={cn(
                "flex gap-4 max-w-3xl mx-auto animate-in slide-in-from-bottom-2 fade-in duration-300",
                msg.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              {msg.role === "assistant" && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-blue-600 flex items-center justify-center shrink-0 shadow-md">
                  <Bot className="w-5 h-5 text-white" />
                </div>
              )}
              
              <div className={cn(
                "flex flex-col gap-2 max-w-[80%]",
                msg.role === "user" ? "items-end" : "items-start"
              )}>
                <div className={cn(
                  "p-4 rounded-2xl text-sm leading-relaxed shadow-sm",
                  msg.role === "user" 
                    ? "bg-slate-900 text-white rounded-tr-sm" 
                    : "bg-slate-50 border border-slate-100 text-slate-800 rounded-tl-sm"
                )}>
                  {msg.content}
                </div>
                
                {/* Rich Content: Chart Mock */}
                {msg.chart && (
                  <div className="w-full bg-white border border-slate-200 p-4 rounded-xl shadow-sm mt-2">
                    <div className="flex items-center gap-2 mb-4">
                      <BarChart3 className="w-4 h-4 text-slate-400" />
                      <span className="text-xs font-bold uppercase text-slate-500">Volume vs Sentiment</span>
                    </div>
                    <div className="h-32 bg-slate-50 rounded flex items-center justify-center text-xs text-slate-400 font-mono border border-dashed border-slate-200">
                      [ Interactive Chart Component ]
                    </div>
                  </div>
                )}
              </div>

              {msg.role === "user" && (
                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                  <User className="w-5 h-5 text-slate-500" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Input Area */}
        <div className="p-6 bg-white/80 backdrop-blur-md border-t border-slate-100">
          <div className="max-w-3xl mx-auto space-y-4">
            
            {/* Quick Suggestions */}
            {messages.length < 2 && (
              <div className="flex gap-2 justify-center pb-2">
                {SUGGESTIONS.map((s, i) => (
                  <button 
                    key={i} 
                    onClick={() => setInputValue(s.label)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-full text-xs font-medium text-slate-600 hover:bg-slate-100 hover:border-slate-300 transition-all"
                  >
                    <s.icon className="w-3.5 h-3.5 text-purple-500" />
                    {s.label}
                  </button>
                ))}
              </div>
            )}

            <div className="relative shadow-lg rounded-2xl">
              <Input 
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Ask A.D.A anything about your game data..." 
                className="h-14 pl-5 pr-14 rounded-2xl border-slate-200 bg-white text-base shadow-sm focus-visible:ring-2 focus-visible:ring-purple-500/20"
              />
              <Button 
                onClick={handleSend}
                size="icon" 
                className="absolute right-2 top-2 h-10 w-10 rounded-xl bg-purple-600 hover:bg-purple-700 text-white transition-colors shadow-sm"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="text-center">
              <p className="text-[10px] text-slate-400 font-medium flex items-center justify-center gap-1.5">
                <Sparkles className="w-3 h-3 text-purple-400" />
                A.D.A can make mistakes. Always verify with Insights.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

function Settings2(props: any) {
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
      <path d="M20 7h-9" />
      <path d="M14 17H5" />
      <circle cx="17" cy="17" r="3" />
      <circle cx="7" cy="7" r="3" />
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