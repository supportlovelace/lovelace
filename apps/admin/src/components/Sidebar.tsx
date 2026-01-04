import { Link, useLocation } from 'wouter';
import { Building2, Users, LayoutDashboard, Database, Gamepad2, Share2, HelpCircle, MessageSquare, Settings2, ShieldAlert } from 'lucide-react';

export function Sidebar() {
  const [location] = useLocation();

  const navItems = [
    {
      title: "Général",
      items: [
        { href: "/", label: "Dashboard", icon: LayoutDashboard },
      ]
    },
    {
      title: "Structure",
      items: [
        { href: "/publishers", label: "Publishers", icon: Building2 },
        { href: "/games", label: "Jeux", icon: Gamepad2 },
        { href: "/platforms", label: "Plateformes", icon: Share2 },
      ]
    },
    {
      title: "Intégrations",
      items: [
        { href: "/discord", label: "Discord", icon: MessageSquare },
      ]
    },
    {
      title: "Contenu",
      items: [
        { href: "/tooltips", label: "Tooltips", icon: HelpCircle },
        { href: "/onboarding-global", label: "Onboarding Global", icon: Settings2 },
      ]
    },
    {
      title: "IAM",
      items: [
        { href: "/users", label: "Utilisateurs", icon: Users },
      ]
    },
    {
      title: "Monitoring",
      items: [
        { href: "/monitoring", label: "Alertes", icon: ShieldAlert },
      ]
    }
  ];

  return (
    <aside className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col" style={{ height: 'calc(100vh - 4rem)' }}>
      <nav className="flex-1 p-4 space-y-8">
        {navItems.map((section) => (
          <div key={section.title} className="space-y-2">
            <h2 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              {section.title}
            </h2>
            <ul className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = location === item.href || (item.href !== '/' && location.startsWith(item.href));
                
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
      
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center gap-2 px-3 py-2 text-xs text-gray-400 font-mono">
          <Database className="w-3 h-3" />
          LOVELACE ADMIN v0.1
        </div>
      </div>
    </aside>
  );
}