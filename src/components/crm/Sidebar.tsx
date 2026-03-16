"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard,
  Users,
  Target,
  Kanban,
  CheckSquare,
  FileSpreadsheet,
  UserCog,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";

const navItems = [
  { href: "/crm/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/crm/customers", label: "Müşteriler", icon: Users },
  { href: "/crm/leads", label: "Lead & Fırsatlar", icon: Target },
  { href: "/crm/pipeline", label: "Satış Pipeline", icon: Kanban },
  { href: "/crm/tasks", label: "Görevler", icon: CheckSquare },
  { href: "/crm/reports", label: "Raporlar", icon: FileSpreadsheet },
  { href: "/crm/users", label: "Kullanıcılar", icon: UserCog },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { logout, user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`${collapsed ? "w-16" : "w-64"} min-h-screen bg-gradient-to-b from-indigo-700 to-purple-800 flex flex-col transition-all duration-300 shadow-xl`}
    >
      {/* Logo */}
      <div className="flex items-center justify-between px-4 py-5 border-b border-white/20">
        {!collapsed && (
          <div>
            <p className="text-white font-bold text-lg leading-tight" style={{ fontFamily: "Playfair Display, serif" }}>
              Goldstone
            </p>
            <p className="text-indigo-200 text-xs">Visa CRM</p>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-2 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                active
                  ? "bg-white text-indigo-700 shadow font-semibold"
                  : "text-indigo-100 hover:bg-white/15 hover:text-white"
              }`}
              title={collapsed ? label : undefined}
            >
              <Icon size={20} className="flex-shrink-0" />
              {!collapsed && <span className="text-sm">{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User & Logout */}
      <div className="border-t border-white/20 p-3">
        {!collapsed && (
          <p className="text-indigo-200 text-xs px-2 mb-2 truncate">{user?.email}</p>
        )}
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-indigo-100 hover:bg-white/15 hover:text-white transition"
          title={collapsed ? "Çıkış" : undefined}
        >
          <LogOut size={20} className="flex-shrink-0" />
          {!collapsed && <span className="text-sm">Çıkış Yap</span>}
        </button>
      </div>
    </aside>
  );
}
