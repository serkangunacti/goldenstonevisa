"use client";

import CrmShell from "@/components/crm/CrmShell";
import { useEffect, useState } from "react";
import {
  Customer,
  subscribeToCollection,
  addRecord,
  updateRecord,
  deleteRecord,
} from "@/lib/firestore";
import { Plus, Search, Edit2, Trash2, X, Check, Download } from "lucide-react";
import * as XLSX from "xlsx";

const EMPTY: Omit<Customer, "id" | "olusturmaTarihi"> = {
  ad: "",
  musteriTipi: "Bireysel",
  vizeTipi: "Turizm",
  hedefUlke: "",
  botKullanimi: false,
  botUcreti: 0,
  islemAsamasi: "Yeni",
  odemeDurumu: "Bekliyor",
  odemetutari: 0,
  notlar: "",
};

const STATUS_COLORS: Record<string, string> = {
  "Yeni": "bg-blue-100 text-blue-700",
  "Devam Ediyor": "bg-yellow-100 text-yellow-700",
  "Olumlu": "bg-green-100 text-green-700",
  "Olumsuz": "bg-red-100 text-red-700",
  "Beklemede": "bg-gray-100 text-gray-700",
};

const PAYMENT_COLORS: Record<string, string> = {
  "Ödendi": "bg-green-100 text-green-700",
  "Bekliyor": "bg-yellow-100 text-yellow-700",
  "Kısmi": "bg-orange-100 text-orange-700",
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Tümü");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    return subscribeToCollection<Customer>("customers", setCustomers);
  }, []);

  const filtered = customers.filter((c) => {
    const matchSearch = c.ad.toLowerCase().includes(search.toLowerCase()) ||
      c.hedefUlke.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "Tümü" || c.islemAsamasi === statusFilter;
    return matchSearch && matchStatus;
  });

  const openAdd = () => { setForm({ ...EMPTY }); setEditId(null); setShowForm(true); };
  const openEdit = (c: Customer) => {
    setForm({ ...EMPTY, ...c });
    setEditId(c.id!);
    setShowForm(true);
  };
  const closeForm = () => { setShowForm(false); setEditId(null); };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editId) {
        await updateRecord<Customer>("customers", editId, form);
      } else {
        await addRecord<Omit<Customer, "id" | "olusturmaTarihi">>("customers", form);
      }
      closeForm();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteRecord("customers", id);
    setDeleteId(null);
  };

  const exportExcel = () => {
    const data = filtered.map((c, i) => ({
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
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Müşteriler");
    XLSX.writeFile(wb, "musteriler.xlsx");
  };

  const F = (key: keyof typeof form, val: string | boolean | number) =>
    setForm((p) => ({ ...p, [key]: val }));

  return (
    <CrmShell>
      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-6 gap-3">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">Müşteri Yönetimi</h1>
            <p className="text-gray-500 text-sm mt-1">{customers.length} kayıt</p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button onClick={exportExcel} className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition shadow">
              <Download size={15} /> <span className="hidden sm:inline">Excel</span>
            </button>
            <button onClick={openAdd} className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition shadow">
              <Plus size={15} /> <span className="hidden sm:inline">Yeni Müşteri</span><span className="sm:hidden">Ekle</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-5 flex-wrap">
          <div className="relative flex-1 min-w-[180px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Müşteri veya ülke ara..."
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {["Tümü", "Yeni", "Devam Ediyor", "Olumlu", "Olumsuz", "Beklemede"].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {["#", "Müşteri Adı", "Tipi", "Vize", "Ülke", "Bot", "Bot Ücr.", "Durum", "Ödeme", "Tutar", "İşlem"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="text-center py-12 text-gray-400">Kayıt bulunamadı</td>
                  </tr>
                ) : (
                  filtered.map((c, i) => (
                    <tr key={c.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                      <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">{c.ad}</td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{c.musteriTipi}</td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{c.vizeTipi}</td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{c.hedefUlke}</td>
                      <td className="px-4 py-3 text-center">
                        {c.botKullanimi
                          ? <Check size={16} className="text-green-500 mx-auto" />
                          : <X size={16} className="text-red-400 mx-auto" />}
                      </td>
                      <td className="px-4 py-3 text-gray-600">₺{c.botUcreti.toLocaleString("tr-TR")}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[c.islemAsamasi] || "bg-gray-100 text-gray-700"}`}>
                          {c.islemAsamasi}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${PAYMENT_COLORS[c.odemeDurumu] || "bg-gray-100 text-gray-700"}`}>
                          {c.odemeDurumu}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">₺{c.odemetutari.toLocaleString("tr-TR")}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <button onClick={() => openEdit(c)} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition">
                            <Edit2 size={15} />
                          </button>
                          <button onClick={() => setDeleteId(c.id!)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-3">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-gray-400 bg-white rounded-2xl border border-gray-100">
              Kayıt bulunamadı
            </div>
          ) : filtered.map((c) => (
            <div key={c.id} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{c.ad}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{c.musteriTipi} · {c.vizeTipi} · {c.hedefUlke}</p>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => openEdit(c)} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition">
                    <Edit2 size={15} />
                  </button>
                  <button onClick={() => setDeleteId(c.id!)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[c.islemAsamasi] || "bg-gray-100 text-gray-700"}`}>
                  {c.islemAsamasi}
                </span>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${PAYMENT_COLORS[c.odemeDurumu] || "bg-gray-100 text-gray-700"}`}>
                  {c.odemeDurumu}
                </span>
                {c.botKullanimi && (
                  <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
                    Bot ₺{c.botUcreti.toLocaleString("tr-TR")}
                  </span>
                )}
              </div>
              <p className="text-sm font-semibold text-gray-700 mt-2">₺{c.odemetutari.toLocaleString("tr-TR")}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-semibold">{editId ? "Müşteri Düzenle" : "Yeni Müşteri Ekle"}</h2>
              <button onClick={closeForm} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Müşteri Adı *</label>
                <input value={form.ad} onChange={(e) => F("ad", e.target.value)} className="input-field" placeholder="Ad Soyad" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Müşteri Tipi</label>
                <select value={form.musteriTipi} onChange={(e) => F("musteriTipi", e.target.value)} className="input-field">
                  {["Bireysel", "Kurumsal", "Aile"].map((o) => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vize Tipi</label>
                <select value={form.vizeTipi} onChange={(e) => F("vizeTipi", e.target.value)} className="input-field">
                  {["Turizm", "Öğrenci", "Çalışma", "İş", "Oturum İzni", "Aile Birleşimi", "Göç/Vatandaşlık"].map((o) => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hedef Ülke</label>
                <input value={form.hedefUlke} onChange={(e) => F("hedefUlke", e.target.value)} className="input-field" placeholder="Almanya, Hollanda..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">İşlem Aşaması</label>
                <select value={form.islemAsamasi} onChange={(e) => F("islemAsamasi", e.target.value as Customer["islemAsamasi"])} className="input-field">
                  {["Yeni", "Devam Ediyor", "Olumlu", "Olumsuz", "Beklemede"].map((o) => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ödeme Durumu</label>
                <select value={form.odemeDurumu} onChange={(e) => F("odemeDurumu", e.target.value as Customer["odemeDurumu"])} className="input-field">
                  {["Bekliyor", "Ödendi", "Kısmi"].map((o) => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ödeme Tutarı (₺)</label>
                <input type="number" value={form.odemetutari} onChange={(e) => F("odemetutari", Number(e.target.value))} className="input-field" />
              </div>
              <div className="flex items-center gap-3">
                <label className="block text-sm font-medium text-gray-700">Bot Kullanımı</label>
                <button
                  type="button"
                  onClick={() => F("botKullanimi", !form.botKullanimi)}
                  className={`relative w-12 h-6 rounded-full transition ${form.botKullanimi ? "bg-indigo-600" : "bg-gray-300"}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${form.botKullanimi ? "left-7" : "left-1"}`} />
                </button>
              </div>
              {form.botKullanimi && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bot Ücreti (₺)</label>
                  <input type="number" value={form.botUcreti} onChange={(e) => F("botUcreti", Number(e.target.value))} className="input-field" />
                </div>
              )}
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Notlar</label>
                <textarea value={form.notlar} onChange={(e) => F("notlar", e.target.value)} className="input-field resize-none h-24" placeholder="Ek notlar..." />
              </div>
            </div>
            <div className="flex gap-3 justify-end p-5 border-t">
              <button onClick={closeForm} className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 hover:bg-gray-50 transition">İptal</button>
              <button onClick={handleSave} disabled={!form.ad || saving} className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-50">
                {saving ? "Kaydediliyor..." : "Kaydet"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full text-center">
            <Trash2 size={40} className="text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Kaydı Sil</h3>
            <p className="text-gray-500 text-sm mb-6">Bu müşteriyi silmek istediğinizden emin misiniz?</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm hover:bg-gray-50">İptal</button>
              <button onClick={() => handleDelete(deleteId)} className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700">Sil</button>
            </div>
          </div>
        </div>
      )}
    </CrmShell>
  );
}
