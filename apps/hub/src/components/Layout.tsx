import type { ReactNode } from "react";

import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="h-screen bg-background p-2 overflow-hidden flex gap-4">
      <Sidebar />
      <div className="flex flex-1 flex-col h-full overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-4">{children}</main>
      </div>
    </div>
  );
}
