"use client";

import CrmShell from "@/components/crm/CrmShell";
import { useEffect, useState } from "react";
import { subscribeToCollection, Customer, Lead, Task } from "@/lib/firestore";
import { Users, Target, TrendingUp, CheckSquare, Clock, AlertCircle } from "lucide-react";

interface StatCard {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
  bg: string;
}

export default function DashboardPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    const u1 = subscribeToCollection<Customer>("customers", setCustomers);
    const u2 = subscribeToCollection<Lead>("leads", setLeads);
    const u3 = subscribeToCollection<Task>("tasks", setTasks);
    return () => { u1(); u2(); u3(); };
  }, []);

  const stats: StatCard[] = [
    {
      label: "Toplam Müşteri",
      value: customers.length,
      icon: Users,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
    },
    {
      label: "Aktif Lead",
      value: leads.filter((l) => l.durum !== "Kazanıldı" && l.durum !== "Kaybedildi").length,
      icon: Target,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "Olumlu Sonuç",
      value: customers.filter((c) => c.islemAsamasi === "Olumlu").length,
      icon: TrendingUp,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
    {
      label: "Bekleyen Görev",
      value: tasks.filter((t) => t.durum === "Bekliyor").length,
      icon: CheckSquare,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
  ];

  const recentCustomers = customers.slice(0, 5);
  const pendingTasks = tasks.filter((t) => t.durum !== "Tamamlandı").slice(0, 5);

  const statusColor: Record<string, string> = {
    "Yeni": "bg-blue-100 text-blue-700",
    "Devam Ediyor": "bg-yellow-100 text-yellow-700",
    "Olumlu": "bg-green-100 text-green-700",
    "Olumsuz": "bg-red-100 text-red-700",
    "Beklemede": "bg-gray-100 text-gray-700",
  };

  const priorityColor: Record<string, string> = {
    "Yüksek": "bg-red-100 text-red-700",
    "Orta": "bg-yellow-100 text-yellow-700",
    "Düşük": "bg-green-100 text-green-700",
  };

  return (
    <CrmShell>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Genel bakış ve özet bilgiler</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {stats.map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
              <div className={`${bg} p-3 rounded-xl`}>
                <Icon className={color} size={24} />
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900">{value}</p>
                <p className="text-sm text-gray-500">{label}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Customers */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Son Müşteriler</h2>
              <a href="/crm/customers" className="text-indigo-600 text-sm hover:underline">Tümünü gör</a>
            </div>
            {recentCustomers.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">Henüz müşteri yok</p>
            ) : (
              <div className="space-y-3">
                {recentCustomers.map((c) => (
                  <div key={c.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{c.ad}</p>
                      <p className="text-xs text-gray-400">{c.vizeTipi} — {c.hedefUlke}</p>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColor[c.islemAsamasi] || "bg-gray-100 text-gray-700"}`}>
                      {c.islemAsamasi}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pending Tasks */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Bekleyen Görevler</h2>
              <a href="/crm/tasks" className="text-indigo-600 text-sm hover:underline">Tümünü gör</a>
            </div>
            {pendingTasks.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">Bekleyen görev yok</p>
            ) : (
              <div className="space-y-3">
                {pendingTasks.map((t) => (
                  <div key={t.id} className="flex items-start justify-between py-2 border-b border-gray-50 last:border-0">
                    <div className="flex items-start gap-2">
                      <Clock size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-800">{t.baslik}</p>
                        <p className="text-xs text-gray-400">Son: {t.sonTarih}</p>
                      </div>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${priorityColor[t.oncelik] || "bg-gray-100 text-gray-700"}`}>
                      {t.oncelik}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Customer Status Distribution */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mt-6">
          <h2 className="font-semibold text-gray-900 mb-4">Müşteri Durum Dağılımı</h2>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            {["Yeni", "Devam Ediyor", "Olumlu", "Olumsuz", "Beklemede"].map((status) => {
              const count = customers.filter((c) => c.islemAsamasi === status).length;
              const pct = customers.length > 0 ? Math.round((count / customers.length) * 100) : 0;
              return (
                <div key={status} className="text-center">
                  <div className={`text-2xl font-bold ${statusColor[status]?.split(" ")[1] || "text-gray-700"}`}>
                    {count}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{status}</div>
                  <div className="mt-2 h-2 bg-gray-100 rounded-full">
                    <div
                      className={`h-2 rounded-full ${statusColor[status]?.replace("text-", "bg-").split(" ")[0] || "bg-gray-300"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </CrmShell>
  );
}
