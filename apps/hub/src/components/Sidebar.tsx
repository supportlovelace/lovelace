import { Link, useLocation } from "wouter";
import {
  House,
  MessageSquare,
  Share2,
  Lightbulb,
  BarChart3,
  Wrench,
  User,
  LogOut,
  HelpCircle,
} from "lucide-react";
import { cn } from "@repo/ui/lib/utils.ts";

export function Sidebar() {
  const [location] = useLocation();

  const mainItems = [
    { href: "/dashboard", label: "Dashboard", icon: House },
    { href: "/chat-ai", label: "Chat AI", icon: MessageSquare },
    { href: "/the-hub", label: "The Hub", icon: Share2 },
    { href: "/insights", label: "Insights", icon: Lightbulb },
    { href: "/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/settings", label: "Settings", icon: Wrench },
  ];

  const accountItems = [
    { href: "/account", label: "Account", icon: User },
    { href: "/signout", label: "Sign Out", icon: LogOut },
  ];

  const isActive = (href: string) => location === href;

  return (
    <nav id="hub-sidebar" className="w-[200px] 2xl:w-[220px] h-full bg-[#0a0f1e] text-white p-3 flex flex-col justify-between rounded-3xl shrink-0 shadow-xl border border-white/5">
      <div>
        <div
          className="flex justify-center items-center mb-6 p-0 border-b-[2px] border-transparent"
          style={{
            borderImage:
              "linear-gradient(to right, transparent, rgb(224, 225, 226) 50%, transparent) 1 / 1 / 0 stretch",
          }}
        >
          <Link href="/dashboard">
            <img
              alt="Lovelace"
              className="w-auto h-auto max-h-12 max-w-32"
              src="https://cdn.lovelace.gg/email/Lovelace%20logo%20blanc.png"
            />
          </Link>
        </div>
        <ul className="2xl:space-y-2 space-y-1">
          {mainItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 p-3 transition relative group pl-5 text-sm 2xl:text-base rounded-xl",
                    isActive(item.href)
                      ? "bg-gradient-to-r from-purple-600/40 to-transparent border-l-2 border-purple-500 text-white"
                      : "hover:bg-gradient-to-r hover:from-white/10 hover:to-transparent hover:border-l-2 hover:border-white/20 text-gray-300",
                  )}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className="text-light">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
        <div className="mt-6">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-3 pl-4">
            User Center
          </h3>
          <ul className="space-y-1">
            {accountItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 p-3 transition relative group pl-5 w-full text-left cursor-pointer text-sm rounded-xl",
                      isActive(item.href)
                        ? "bg-gradient-to-r from-purple-600/40 to-transparent border-l-2 border-purple-500 text-white"
                        : "hover:bg-gradient-to-r hover:from-white/10 hover:to-transparent hover:border-l-2 hover:border-white/20 text-gray-300",
                    )}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span className="text-light">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
      <div
        className="hidden md:flex flex-col bg-cover bg-center rounded-3xl p-4 mt-6 items-start shadow-inner border border-white/5"
        style={{
          backgroundImage:
            'url("https://cdn.lovelace.gg/frontend/contact_background.webp")',
        }}
      >
        <HelpCircle className="w-6 h-6 text-white mb-2" />
        <p className="text-sm text-white font-bold">A.D.A Support</p>
        <p className="text-[10px] text-gray-200">Need expert assistance?</p>
        <button className="mt-3 px-3 py-1.5 bg-white text-blue-600 text-xs font-bold w-full rounded-lg cursor-pointer hover:bg-gray-100 transition-colors shadow-lg">
          Ask Help
        </button>
      </div>
    </nav>
  );
}