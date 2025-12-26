import type { ReactNode } from "react";

import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="h-screen w-screen bg-slate-50/50 p-3 overflow-hidden flex gap-4">
      <Sidebar />
      <div className="flex flex-1 flex-col h-full overflow-hidden bg-white rounded-[2rem] border border-slate-200 shadow-sm">
        <Header />
        {/* On enlève le padding ici pour que les pages comme le Hub puissent coller aux bords si besoin */}
        <main className="flex-1 overflow-hidden relative">
          {children}
        </main>
      </div>
    </div>
  );
}