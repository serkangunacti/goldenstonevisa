"use client";

import CrmShell from "@/components/crm/CrmShell";
import { useEffect, useState } from "react";
import { Lead, subscribeToCollection, addRecord, updateRecord, deleteRecord } from "@/lib/firestore";
import { Plus, Search, Edit2, Trash2, X, Download } from "lucide-react";
import * as XLSX from "xlsx";

const EMPTY: Omit<Lead, "id" | "olusturmaTarihi"> = {
  ad: "",
  email: "",
  telefon: "",
  ilgiAlani: "Turizm Vizesi",
  hedefUlke: "",
  durum: "Yeni",
  kaynak: "Web Sitesi",
  notlar: "",
  tahminiDeger: 0,
};

const STATUS_COLORS: Record<string, string> = {
  "Yeni": "bg-blue-100 text-blue-700",
  "İletişime Geçildi": "bg-purple-100 text-purple-700",
  "Nitelikli": "bg-indigo-100 text-indigo-700",
  "Teklif Verildi": "bg-yellow-100 text-yellow-700",
  "Kazanıldı": "bg-green-100 text-green-700",
  "Kaybedildi": "bg-red-100 text-red-700",
};

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Tümü");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => subscribeToCollection<Lead>("leads", setLeads), []);

  const filtered = leads.filter((l) => {
    const matchSearch =
      l.ad.toLowerCase().includes(search.toLowerCase()) ||
      l.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "Tümü" || l.durum === statusFilter;
    return matchSearch && matchStatus;
  });

  const openAdd = () => { setForm({ ...EMPTY }); setEditId(null); setShowForm(true); };
  const openEdit = (l: Lead) => { setForm({ ...EMPTY, ...l }); setEditId(l.id!); setShowForm(true); };
  const closeForm = () => { setShowForm(false); setEditId(null); };

  const handleSave = async () => {
    setSaving(true);
    try {
      editId
        ? await updateRecord<Lead>("leads", editId, form)
        : await addRecord("leads", form);
      closeForm();
    } finally { setSaving(false); }
  };

  const F = (k: keyof typeof form, v: string | number) => setForm((p) => ({ ...p, [k]: v }));

  const exportExcel = () => {
    const data = filtered.map((l, i) => ({
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
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Leadler");
    XLSX.writeFile(wb, "leadler.xlsx");
  };

  return (
    <CrmShell>
      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        <div className="flex items-start justify-between mb-6 gap-3">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">Lead & Fırsat Takibi</h1>
            <p className="text-gray-500 text-sm mt-1">{leads.length} kayıt</p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button onClick={exportExcel} className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition shadow">
              <Download size={15} /> <span className="hidden sm:inline">Excel</span>
            </button>
            <button onClick={openAdd} className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition shadow">
              <Plus size={15} /> <span className="hidden sm:inline">Yeni Lead</span><span className="sm:hidden">Ekle</span>
            </button>
          </div>
        </div>

        {/* Status summary */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-6">
          {["Yeni", "İletişime Geçildi", "Nitelikli", "Teklif Verildi", "Kazanıldı", "Kaybedildi"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(statusFilter === s ? "Tümü" : s)}
              className={`p-2.5 rounded-xl border text-center transition ${statusFilter === s ? "border-indigo-400 bg-indigo-50" : "border-gray-100 bg-white hover:border-gray-200"}`}
            >
              <div className="text-lg font-bold text-gray-900">{leads.filter((l) => l.durum === s).length}</div>
              <div className={`text-xs mt-1 px-1 py-0.5 rounded-full leading-tight ${STATUS_COLORS[s]}`}>{s}</div>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="mb-5">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Ad veya e-posta ara..." className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {["#", "Ad Soyad", "E-posta", "Telefon", "İlgi", "Ülke", "Kaynak", "Tahmini Değer", "Durum", "İşlem"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.length === 0 ? (
                  <tr><td colSpan={10} className="text-center py-12 text-gray-400">Kayıt bulunamadı</td></tr>
                ) : filtered.map((l, i) => (
                  <tr key={l.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">{l.ad}</td>
                    <td className="px-4 py-3 text-gray-600">{l.email}</td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{l.telefon}</td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{l.ilgiAlani}</td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{l.hedefUlke}</td>
                    <td className="px-4 py-3 text-gray-600">{l.kaynak}</td>
                    <td className="px-4 py-3 text-gray-600">₺{l.tahminiDeger.toLocaleString("tr-TR")}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[l.durum] || "bg-gray-100 text-gray-700"}`}>{l.durum}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(l)} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"><Edit2 size={15} /></button>
                        <button onClick={() => setDeleteId(l.id!)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition"><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-3">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-gray-400 bg-white rounded-2xl border border-gray-100">Kayıt bulunamadı</div>
          ) : filtered.map((l) => (
            <div key={l.id} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{l.ad}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{l.email}</p>
                  {l.telefon && <p className="text-xs text-gray-500">{l.telefon}</p>}
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => openEdit(l)} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"><Edit2 size={15} /></button>
                  <button onClick={() => setDeleteId(l.id!)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition"><Trash2 size={15} /></button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[l.durum] || "bg-gray-100 text-gray-700"}`}>{l.durum}</span>
                <span className="px-2.5 py-1 rounded-full text-xs bg-gray-100 text-gray-600">{l.ilgiAlani}</span>
                {l.hedefUlke && <span className="px-2.5 py-1 rounded-full text-xs bg-gray-100 text-gray-600">{l.hedefUlke}</span>}
              </div>
              <p className="text-sm font-semibold text-gray-700 mt-2">₺{l.tahminiDeger.toLocaleString("tr-TR")}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-semibold">{editId ? "Lead Düzenle" : "Yeni Lead Ekle"}</h2>
              <button onClick={closeForm} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Ad Soyad *</label>
                <input value={form.ad} onChange={(e) => F("ad", e.target.value)} className="input-field" placeholder="Ad Soyad" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">E-posta</label>
                <input type="email" value={form.email} onChange={(e) => F("email", e.target.value)} className="input-field" placeholder="ornek@mail.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
                <input value={form.telefon} onChange={(e) => F("telefon", e.target.value)} className="input-field" placeholder="05XX XXX XX XX" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">İlgi Alanı</label>
                <select value={form.ilgiAlani} onChange={(e) => F("ilgiAlani", e.target.value)} className="input-field">
                  {["Turizm Vizesi", "Öğrenci Vizesi", "Çalışma Vizesi", "İş Vizesi", "Oturum İzni", "Göç/Vatandaşlık"].map((o) => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hedef Ülke</label>
                <input value={form.hedefUlke} onChange={(e) => F("hedefUlke", e.target.value)} className="input-field" placeholder="Almanya, Hollanda..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kaynak</label>
                <select value={form.kaynak} onChange={(e) => F("kaynak", e.target.value)} className="input-field">
                  {["Web Sitesi", "WhatsApp", "Instagram", "Facebook", "Referans", "Google", "Diğer"].map((o) => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Durum</label>
                <select value={form.durum} onChange={(e) => F("durum", e.target.value as Lead["durum"])} className="input-field">
                  {["Yeni", "İletişime Geçildi", "Nitelikli", "Teklif Verildi", "Kazanıldı", "Kaybedildi"].map((o) => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tahmini Değer (₺)</label>
                <input type="number" value={form.tahminiDeger} onChange={(e) => F("tahminiDeger", Number(e.target.value))} className="input-field" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Notlar</label>
                <textarea value={form.notlar} onChange={(e) => F("notlar", e.target.value)} className="input-field resize-none h-24" />
              </div>
            </div>
            <div className="flex gap-3 justify-end p-5 border-t">
              <button onClick={closeForm} className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm hover:bg-gray-50">İptal</button>
              <button onClick={handleSave} disabled={!form.ad || saving} className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
                {saving ? "Kaydediliyor..." : "Kaydet"}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full text-center">
            <Trash2 size={40} className="text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Lead Sil</h3>
            <p className="text-gray-500 text-sm mb-6">Bu lead kaydını silmek istediğinizden emin misiniz?</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm hover:bg-gray-50">İptal</button>
              <button onClick={() => { deleteRecord("leads", deleteId); setDeleteId(null); }} className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700">Sil</button>
            </div>
          </div>
        </div>
      )}
    </CrmShell>
  );
}
