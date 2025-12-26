import { Link, useLocation } from "wouter";
import { 
  Bell, 
  Search, 
  Check, 
  ChevronsUpDown, 
  CircleDot,
  Users,
  Terminal,
  Crown,
  ChevronDown,
  User,
  LogOut
} from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/ui/components/ui/dropdown-menu.tsx";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@repo/ui/components/ui/popover";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@repo/ui/components/ui/select";
import { Button } from "@repo/ui/components/ui/button";
import { Checkbox } from "@repo/ui/components/ui/checkbox";
import { cn } from "@repo/ui/lib/utils.ts";
import { useUserStore } from "../stores/useUserStore";
import { useAppContext, type Persona } from "../stores/useAppContext";
import { useMe, usePortalGames } from "../hooks/use-portal";
import { LayoutGrid, Inbox as InboxIcon } from "lucide-react";

const titleMap: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/chat-ai": "Chat AI",
  "/the-hub": "The Hub",
  "/insights": "Insights",
  "/analytics": "Analytics",
  "/settings": "Settings",
  "/account": "Account",
};

export function Header() {
  const [location] = useLocation();
  const { user, setUser } = useUserStore();
  const { data: userData } = useMe();
  const { data: gamesData } = usePortalGames();
  const { selectedGameIds, toggleGame, persona, setPersona, resetScope, hubViewMode, setHubViewMode } = useAppContext();
  
  const [search, setSearch] = useState("");
  const title = titleMap[location] || "Hub";

  useEffect(() => {
    if (userData) {
      setUser({
        name: userData.name,
        role: userData.highestRole || "User",
        avatar: "",
      });
    }
  }, [userData, setUser]);

  const games = gamesData?.games || [];
  const filteredGames = games.filter(g => 
    g.name.toLowerCase().includes(search.toLowerCase())
  );

  const scopeLabel = selectedGameIds.length === 0 
    ? "Global Portfolio" 
    : selectedGameIds.length === 1 
      ? games.find(g => g.id === selectedGameIds[0])?.name || "1 Project"
      : `${selectedGameIds.length} Projects`;

  const personas: { value: Persona; label: string; icon: any }[] = [
    { value: "CM", label: "Community Manager", icon: Users },
    { value: "DEV", label: "Developer", icon: Terminal },
    { value: "CEO", label: "CEO / Strategy", icon: Crown },
    { value: "ADMIN", label: "Administrator", icon: CircleDot },
  ];

  const currentPersona = personas.find(p => p.value === persona);

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "JD";

  return (
    <header className="sticky top-0 z-50 h-16 bg-white border-b border-slate-100 px-6 flex items-center justify-between shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
      {/* LEFT: Project Switcher */}
      <div className="flex items-center gap-6">
        <Popover>
          <PopoverTrigger asChild>
            <Button 
              variant="ghost" 
              className="h-10 px-3 hover:bg-slate-50 border border-transparent hover:border-slate-200 rounded-xl transition-all group"
            >
              <div className="flex items-center gap-2.5">
                <div className={cn(
                  "w-2.5 h-2.5 rounded-full",
                  selectedGameIds.length === 0 ? "bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.4)]" : "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"
                )} />
                <span className="font-bold text-slate-900 text-sm tracking-tight">{scopeLabel}</span>
                <ChevronsUpDown className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-600 transition-colors" />
              </div>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[320px] p-0 bg-white border-slate-200 shadow-2xl rounded-2xl overflow-hidden" align="start">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
              <Search className="w-4 h-4 text-slate-400" />
              <input 
                className="bg-transparent border-none outline-none text-sm w-full placeholder:text-slate-400 font-medium"
                placeholder="Find project..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="max-h-[400px] overflow-y-auto p-2 custom-scrollbar">
              <div 
                onClick={resetScope}
                className={cn(
                  "flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all text-sm mb-1",
                  selectedGameIds.length === 0 ? "bg-purple-600 text-white shadow-lg shadow-purple-200" : "hover:bg-slate-50 text-slate-600 font-medium"
                )}
              >
                <div className="flex items-center gap-3">
                  <CircleDot className="w-4 h-4" />
                  Global Portfolio
                </div>
                {selectedGameIds.length === 0 && <Check className="w-4 h-4" />}
              </div>

              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 px-4 py-4">My Projects</div>
              {filteredGames.map((game: any) => (
                <div 
                  key={game.id}
                  onClick={() => toggleGame(game.id)}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all text-sm mb-1",
                    selectedGameIds.includes(game.id) ? "bg-emerald-50 text-emerald-700 border border-emerald-100 font-bold" : "hover:bg-slate-50 text-slate-600 font-medium"
                  )}
                >
                  <div className="flex items-center gap-3 truncate">
                    <Checkbox checked={selectedGameIds.includes(game.id)} className="border-slate-300" />
                    <span className="truncate">{game.name}</span>
                  </div>
                  {selectedGameIds.includes(game.id) && <Check className="w-3.5 h-3.5" />}
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <div className="h-6 w-[1px] bg-slate-200" />
        
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest">{title}</h2>
      </div>

      {/* CENTER: Hub View Switcher (Visible only on Hub page) */}
      {location === "/the-hub" && (
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/50 shadow-inner scale-90">
          <button 
            onClick={() => setHubViewMode("modern")}
            className={cn(
              "px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all flex items-center gap-2",
              hubViewMode === "modern" ? "bg-white text-slate-900 shadow-md" : "text-slate-400 hover:text-slate-600"
            )}
          >
            <InboxIcon className="w-3.5 h-3.5" /> Inbox
          </button>
          <button 
            onClick={() => setHubViewMode("legacy")}
            className={cn(
              "px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all flex items-center gap-2",
              hubViewMode === "legacy" ? "bg-white text-slate-900 shadow-md" : "text-slate-400 hover:text-slate-600"
            )}
          >
            <LayoutGrid className="w-3.5 h-3.5" /> Columns
          </button>
        </div>
      )}

      {/* RIGHT: Persona & User */}
      <div className="flex items-center gap-4">
        {/* Persona Switcher */}
        <Select value={persona} onValueChange={(v) => setPersona(v as Persona)}>
          <SelectTrigger className="w-[180px] h-10 bg-slate-50 border-slate-200 rounded-full text-slate-700 text-xs font-bold hover:bg-slate-100 transition-all">
            <div className="flex items-center gap-2 truncate">
              {currentPersona && <currentPersona.icon className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
              <SelectValue placeholder="Role" />
            </div>
          </SelectTrigger>
          <SelectContent className="rounded-xl border-slate-200 shadow-xl">
            {personas.map((p) => (
              <SelectItem key={p.value} value={p.value} className="py-2.5 text-xs font-semibold">
                <div className="flex items-center gap-2">
                  <p.icon className="w-3.5 h-3.5" />
                  {p.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <button className="relative p-2 text-slate-400 hover:text-slate-600 transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 block h-2 w-2 rounded-full bg-blue-600 border-2 border-white" />
        </button>

        <div className="flex items-center gap-3 pl-2 border-l border-slate-100">
          <div className="hidden lg:flex flex-col items-end text-right">
            <span className="text-sm font-bold text-slate-900 leading-none">{user?.name}</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-1">{user?.role}</span>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-white font-bold text-xs shadow-lg cursor-pointer hover:scale-105 transition-all">
                {initials}
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 mt-2 rounded-xl shadow-2xl border-slate-200 p-2">
              <DropdownMenuItem asChild className="rounded-lg py-3 cursor-pointer">
                <Link href="/account" className="flex items-center gap-2">
                  <User className="w-4 h-4" /> Account Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="rounded-lg py-3 cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50">
                <Link href="/signout" className="flex items-center gap-2">
                  <LogOut className="w-4 h-4" /> Sign Out
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}