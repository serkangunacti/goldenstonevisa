"use client";

import CrmShell from "@/components/crm/CrmShell";
import { useEffect, useState } from "react";
import { Task, subscribeToCollection, addRecord, updateRecord, deleteRecord } from "@/lib/firestore";
import { Plus, X, Edit2, Trash2, CheckCircle2, Circle, Clock } from "lucide-react";

const EMPTY: Omit<Task, "id" | "olusturmaTarihi"> = {
  baslik: "",
  aciklama: "",
  atanan: "",
  ilgiliMusteri: "",
  oncelik: "Orta",
  durum: "Bekliyor",
  sonTarih: "",
};

const PRIORITY_COLORS: Record<string, string> = {
  "Yüksek": "bg-red-100 text-red-700 border-red-200",
  "Orta": "bg-yellow-100 text-yellow-700 border-yellow-200",
  "Düşük": "bg-green-100 text-green-700 border-green-200",
};

const STATUS_COLORS: Record<string, string> = {
  "Bekliyor": "bg-gray-100 text-gray-700",
  "Devam Ediyor": "bg-blue-100 text-blue-700",
  "Tamamlandı": "bg-green-100 text-green-700",
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<"Tümü" | Task["durum"]>("Tümü");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => subscribeToCollection<Task>("tasks", setTasks), []);

  const filtered = tasks.filter((t) => filter === "Tümü" || t.durum === filter);

  const openAdd = () => { setForm({ ...EMPTY }); setEditId(null); setShowForm(true); };
  const openEdit = (t: Task) => { setForm({ ...EMPTY, ...t }); setEditId(t.id!); setShowForm(true); };
  const closeForm = () => { setShowForm(false); setEditId(null); };

  const handleSave = async () => {
    setSaving(true);
    try {
      editId ? await updateRecord<Task>("tasks", editId, form)
             : await addRecord("tasks", form);
      closeForm();
    } finally { setSaving(false); }
  };

  const toggleDone = async (t: Task) => {
    const newStatus = t.durum === "Tamamlandı" ? "Bekliyor" : "Tamamlandı";
    await updateRecord<Task>("tasks", t.id!, { durum: newStatus });
  };

  const F = (k: keyof typeof form, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const counts = {
    "Bekliyor": tasks.filter((t) => t.durum === "Bekliyor").length,
    "Devam Ediyor": tasks.filter((t) => t.durum === "Devam Ediyor").length,
    "Tamamlandı": tasks.filter((t) => t.durum === "Tamamlandı").length,
  };

  const isOverdue = (t: Task) => t.sonTarih && t.durum !== "Tamamlandı" && new Date(t.sonTarih) < new Date();

  return (
    <CrmShell>
      <div className="p-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Görevler & Aktiviteler</h1>
            <p className="text-gray-500 text-sm mt-1">{tasks.length} görev</p>
          </div>
          <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition shadow">
            <Plus size={16} /> Yeni Görev
          </button>
        </div>

        {/* Status tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {(["Tümü", "Bekliyor", "Devam Ediyor", "Tamamlandı"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition border ${
                filter === s
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
              }`}
            >
              {s} {s !== "Tümü" && <span className="ml-1 opacity-70">({counts[s as keyof typeof counts] ?? 0})</span>}
            </button>
          ))}
        </div>

        {/* Task list */}
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-400 bg-white rounded-2xl border border-gray-100">
              <CheckCircle2 size={40} className="mx-auto mb-3 opacity-30" />
              <p>Bu kategoride görev yok</p>
            </div>
          ) : filtered.map((t) => (
            <div
              key={t.id}
              className={`bg-white rounded-2xl border border-gray-100 p-4 shadow-sm flex gap-4 items-start ${t.durum === "Tamamlandı" ? "opacity-60" : ""}`}
            >
              <button onClick={() => toggleDone(t)} className="mt-0.5 flex-shrink-0 text-gray-300 hover:text-indigo-600 transition">
                {t.durum === "Tamamlandı"
                  ? <CheckCircle2 size={22} className="text-green-500" />
                  : <Circle size={22} />}
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={`font-semibold text-gray-900 ${t.durum === "Tamamlandı" ? "line-through text-gray-400" : ""}`}>
                    {t.baslik}
                  </p>
                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={() => openEdit(t)} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg"><Edit2 size={14} /></button>
                    <button onClick={() => setDeleteId(t.id!)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
                  </div>
                </div>
                {t.aciklama && <p className="text-sm text-gray-500 mt-1">{t.aciklama}</p>}
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${PRIORITY_COLORS[t.oncelik]}`}>{t.oncelik}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[t.durum]}`}>{t.durum}</span>
                  {t.ilgiliMusteri && <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{t.ilgiliMusteri}</span>}
                  {t.atanan && <span className="text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">{t.atanan}</span>}
                  {t.sonTarih && (
                    <span className={`text-xs flex items-center gap-1 px-2 py-0.5 rounded-full ${isOverdue(t) ? "bg-red-50 text-red-600" : "bg-gray-100 text-gray-500"}`}>
                      <Clock size={11} />
                      {t.sonTarih}
                      {isOverdue(t) && " • Gecikmiş"}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-semibold">{editId ? "Görevi Düzenle" : "Yeni Görev"}</h2>
              <button onClick={closeForm} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Görev Başlığı *</label>
                <input value={form.baslik} onChange={(e) => F("baslik", e.target.value)} className="input-field" placeholder="Görev başlığı" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
                <textarea value={form.aciklama} onChange={(e) => F("aciklama", e.target.value)} className="input-field resize-none h-20" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Öncelik</label>
                  <select value={form.oncelik} onChange={(e) => F("oncelik", e.target.value)} className="input-field">
                    {["Düşük", "Orta", "Yüksek"].map((o) => <option key={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Durum</label>
                  <select value={form.durum} onChange={(e) => F("durum", e.target.value)} className="input-field">
                    {["Bekliyor", "Devam Ediyor", "Tamamlandı"].map((o) => <option key={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Son Tarih</label>
                  <input type="date" value={form.sonTarih} onChange={(e) => F("sonTarih", e.target.value)} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Atanan Kişi</label>
                  <input value={form.atanan} onChange={(e) => F("atanan", e.target.value)} className="input-field" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">İlgili Müşteri</label>
                <input value={form.ilgiliMusteri} onChange={(e) => F("ilgiliMusteri", e.target.value)} className="input-field" />
              </div>
            </div>
            <div className="flex gap-3 justify-end p-6 border-t">
              <button onClick={closeForm} className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm hover:bg-gray-50">İptal</button>
              <button onClick={handleSave} disabled={!form.baslik || saving} className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
                {saving ? "Kaydediliyor..." : "Kaydet"}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center">
            <Trash2 size={40} className="text-red-500 mx-auto mb-4" />
            <h3 className="font-semibold mb-2">Görevi Sil</h3>
            <p className="text-gray-500 text-sm mb-6">Bu görevi silmek istediğinizden emin misiniz?</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 border rounded-xl text-sm hover:bg-gray-50">İptal</button>
              <button onClick={() => { deleteRecord("tasks", deleteId); setDeleteId(null); }} className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700">Sil</button>
            </div>
          </div>
        </div>
      )}
    </CrmShell>
  );
}
