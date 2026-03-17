"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { Menu } from "lucide-react";

const Sidebar = dynamic(() => import("./Sidebar"), { ssr: false });
const AuthGuard = dynamic(() => import("./AuthGuard"), { ssr: false });

export default function CrmShell({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar
          mobileOpen={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
        />
        <div className="flex-1 flex flex-col min-w-0">
          {/* Mobile header */}
          <div className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition"
            >
              <Menu size={20} />
            </button>
            <span
              className="font-bold text-indigo-700 text-lg"
              style={{ fontFamily: "Playfair Display, serif" }}
            >
              Goldstone CRM
            </span>
          </div>
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
