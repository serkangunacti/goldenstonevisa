"use client";

import CrmShell from "@/components/crm/CrmShell";
import { useEffect, useState } from "react";
import { Customer, Lead, PipelineDeal, Task, subscribeToCollection } from "@/lib/firestore";
import * as XLSX from "xlsx";
import { Download, FileSpreadsheet, Users, Target, Kanban, CheckSquare } from "lucide-react";

export default function ReportsPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [deals, setDeals] = useState<PipelineDeal[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    const u1 = subscribeToCollection<Customer>("customers", setCustomers);
    const u2 = subscribeToCollection<Lead>("leads", setLeads);
    const u3 = subscribeToCollection<PipelineDeal>("pipeline", setDeals);
    const u4 = subscribeToCollection<Task>("tasks", setTasks);
    return () => { u1(); u2(); u3(); u4(); };
  }, []);

  const exportCustomers = () => {
    const data = customers.map((c, i) => ({
      "#": i + 1,
      "Müşteri Adı": c.ad,
      "Müşteri Tipi": c.musteriTipi,
      "Vize Tipi": c.vizeTipi,
      "Hedef Ülke": c.hedefUlke,
      "Bot Kullanımı": c.botKullanimi ? "Evet" : "Hayır",
      "Bot Ücreti (₺)": c.botUcreti,
      "İşlem Aşaması": c.islemAsamasi,
      "Ödeme Durumu": c.odemeDurumu,
      "Ödeme Tutarı (₺)": c.odemetutari,
      "Notlar": c.notlar,
    }));
    exportSheet(data, "Müşteriler", "musteri_raporu.xlsx");
  };

  const exportLeads = () => {
    const data = leads.map((l, i) => ({
      "#": i + 1,
      "Ad Soyad": l.ad,
      "E-posta": l.email,
      "Telefon": l.telefon,
      "İlgi Alanı": l.ilgiAlani,
      "Hedef Ülke": l.hedefUlke,
      "Durum": l.durum,
      "Kaynak": l.kaynak,
      "Tahmini Değer (₺)": l.tahminiDeger,
      "Notlar": l.notlar,
    }));
    exportSheet(data, "Leadler", "lead_raporu.xlsx");
  };

  const exportPipeline = () => {
    const data = deals.map((d, i) => ({
      "#": i + 1,
      "Müşteri Adı": d.musteriAdi,
      "Fırsat Başlığı": d.baslik,
      "Aşama": d.asama,
      "Değer (₺)": d.deger,
      "Olasılık (%)": d.olasilik,
      "Ağırlıklı Değer (₺)": Math.round(d.deger * d.olasilik / 100),
      "Sorumlu": d.sorumlu,
      "Kapanış Tarihi": d.kapanisTarihi,
      "Notlar": d.notlar,
    }));
    exportSheet(data, "Pipeline", "pipeline_raporu.xlsx");
  };

  const exportTasks = () => {
    const data = tasks.map((t, i) => ({
      "#": i + 1,
      "Görev": t.baslik,
      "Açıklama": t.aciklama,
      "Atanan": t.atanan,
      "İlgili Müşteri": t.ilgiliMusteri,
      "Öncelik": t.oncelik,
      "Durum": t.durum,
      "Son Tarih": t.sonTarih,
    }));
    exportSheet(data, "Görevler", "gorev_raporu.xlsx");
  };

  const exportAll = () => {
    const wb = XLSX.utils.book_new();

    const custData = customers.map((c, i) => ({
      "#": i + 1, "Müşteri Adı": c.ad, "Vize Tipi": c.vizeTipi,
      "Hedef Ülke": c.hedefUlke, "İşlem Aşaması": c.islemAsamasi,
      "Ödeme Durumu": c.odemeDurumu, "Ödeme Tutarı (₺)": c.odemetutari,
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(custData), "Müşteriler");

    const leadData = leads.map((l, i) => ({
      "#": i + 1, "Ad Soyad": l.ad, "E-posta": l.email, "Durum": l.durum,
      "İlgi Alanı": l.ilgiAlani, "Tahmini Değer (₺)": l.tahminiDeger,
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(leadData), "Leadler");

    const dealData = deals.map((d, i) => ({
      "#": i + 1, "Müşteri": d.musteriAdi, "Aşama": d.asama,
      "Değer (₺)": d.deger, "Olasılık (%)": d.olasilik,
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(dealData), "Pipeline");

    const taskData = tasks.map((t, i) => ({
      "#": i + 1, "Görev": t.baslik, "Öncelik": t.oncelik,
      "Durum": t.durum, "Son Tarih": t.sonTarih,
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(taskData), "Görevler");

    XLSX.writeFile(wb, `goldstone_crm_rapor_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const exportSheet = (data: Record<string, unknown>[], sheetName: string, fileName: string) => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, fileName);
  };

  const totalRevenue = customers.reduce((s, c) => s + c.odemetutari, 0);
  const totalPipeline = deals.reduce((s, d) => s + d.deger, 0);
  const weightedPipeline = deals.reduce((s, d) => s + (d.deger * d.olasilik) / 100, 0);

  const reportCards = [
    {
      title: "Müşteri Raporu",
      desc: "Tüm müşteri kayıtları, vize tipleri ve ödeme durumları",
      count: customers.length,
      icon: Users,
      color: "indigo",
      action: exportCustomers,
    },
    {
      title: "Lead Raporu",
      desc: "Tüm lead ve fırsat kayıtları, iletişim bilgileri",
      count: leads.length,
      icon: Target,
      color: "purple",
      action: exportLeads,
    },
    {
      title: "Pipeline Raporu",
      desc: "Satış fırsatları, aşamalar ve tahmini değerler",
      count: deals.length,
      icon: Kanban,
      color: "blue",
      action: exportPipeline,
    },
    {
      title: "Görev Raporu",
      desc: "Tüm görevler, öncelikler ve tamamlanma durumları",
      count: tasks.length,
      icon: CheckSquare,
      color: "amber",
      action: exportTasks,
    },
  ];

  const colorMap: Record<string, string> = {
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
    purple: "bg-purple-50 text-purple-600 border-purple-100",
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
  };

  return (
    <CrmShell>
      <div className="p-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Excel Raporlama</h1>
            <p className="text-gray-500 text-sm mt-1">Modül bazlı veya toplu Excel çıktısı al</p>
          </div>
          <button
            onClick={exportAll}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-700 text-white rounded-xl text-sm font-semibold hover:opacity-90 transition shadow-lg"
          >
            <Download size={16} /> Tümünü İndir
          </button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <p className="text-sm text-gray-500">Toplam Tahsilat</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">₺{totalRevenue.toLocaleString("tr-TR")}</p>
            <p className="text-xs text-gray-400 mt-1">{customers.filter(c => c.odemeDurumu === "Ödendi").length} ödeme tamamlandı</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <p className="text-sm text-gray-500">Pipeline Değeri</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">₺{totalPipeline.toLocaleString("tr-TR")}</p>
            <p className="text-xs text-gray-400 mt-1">{deals.length} aktif fırsat</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <p className="text-sm text-gray-500">Ağırlıklı Pipeline</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">₺{Math.round(weightedPipeline).toLocaleString("tr-TR")}</p>
            <p className="text-xs text-gray-400 mt-1">Olasılık ağırlıklı toplam</p>
          </div>
        </div>

        {/* Report cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {reportCards.map(({ title, desc, count, icon: Icon, color, action }) => (
            <div key={title} className={`bg-white rounded-2xl border ${colorMap[color].split(" ")[2]} p-6 shadow-sm`}>
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl ${colorMap[color].split(" ")[0]}`}>
                  <Icon className={colorMap[color].split(" ")[1]} size={24} />
                </div>
                <span className="text-3xl font-bold text-gray-900">{count}</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
              <p className="text-sm text-gray-500 mb-4">{desc}</p>
              <button
                onClick={action}
                className="w-full flex items-center justify-center gap-2 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
              >
                <FileSpreadsheet size={16} className="text-emerald-600" />
                Excel İndir
              </button>
            </div>
          ))}
        </div>
      </div>
    </CrmShell>
  );
}
