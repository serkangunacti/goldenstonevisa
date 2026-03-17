"use client";

import CrmShell from "@/components/crm/CrmShell";
import { useEffect, useState } from "react";
import { PipelineDeal, subscribeToCollection, addRecord, updateRecord, deleteRecord } from "@/lib/firestore";
import { Plus, X, Edit2, Trash2 } from "lucide-react";

const STAGES: PipelineDeal["asama"][] = [
  "Farkındalık",
  "İlgi",
  "Değerlendirme",
  "Karar",
  "Satın Alma",
];

const STAGE_COLORS: Record<string, string> = {
  "Farkındalık": "border-blue-400 bg-blue-50",
  "İlgi": "border-purple-400 bg-purple-50",
  "Değerlendirme": "border-yellow-400 bg-yellow-50",
  "Karar": "border-orange-400 bg-orange-50",
  "Satın Alma": "border-green-400 bg-green-50",
};

const STAGE_HEADER: Record<string, string> = {
  "Farkındalık": "bg-blue-500",
  "İlgi": "bg-purple-500",
  "Değerlendirme": "bg-yellow-500",
  "Karar": "bg-orange-500",
  "Satın Alma": "bg-green-500",
};

const STAGE_TAB: Record<string, string> = {
  "Farkındalık": "border-blue-400 text-blue-700 bg-blue-50",
  "İlgi": "border-purple-400 text-purple-700 bg-purple-50",
  "Değerlendirme": "border-yellow-400 text-yellow-700 bg-yellow-50",
  "Karar": "border-orange-400 text-orange-700 bg-orange-50",
  "Satın Alma": "border-green-400 text-green-700 bg-green-50",
};

const EMPTY: Omit<PipelineDeal, "id" | "olusturmaTarihi"> = {
  musteriAdi: "",
  baslik: "",
  asama: "Farkındalık",
  deger: 0,
  olasilik: 50,
  sorumlu: "",
  kapanisTarihi: "",
  notlar: "",
};

export default function PipelinePage() {
  const [deals, setDeals] = useState<PipelineDeal[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [mobileStage, setMobileStage] = useState<PipelineDeal["asama"]>("Farkındalık");

  useEffect(() => subscribeToCollection<PipelineDeal>("pipeline", setDeals), []);

  const openAdd = (stage?: PipelineDeal["asama"]) => {
    setForm({ ...EMPTY, asama: stage || "Farkındalık" });
    setEditId(null);
    setShowForm(true);
  };
  const openEdit = (d: PipelineDeal) => { setForm({ ...EMPTY, ...d }); setEditId(d.id!); setShowForm(true); };
  const closeForm = () => { setShowForm(false); setEditId(null); };

  const handleSave = async () => {
    setSaving(true);
    try {
      editId ? await updateRecord<PipelineDeal>("pipeline", editId, form)
             : await addRecord("pipeline", form);
      closeForm();
    } finally { setSaving(false); }
  };

  const F = (k: keyof typeof form, v: string | number) => setForm((p) => ({ ...p, [k]: v }));

  const totalValue = deals.reduce((s, d) => s + d.deger, 0);
  const weightedValue = deals.reduce((s, d) => s + (d.deger * d.olasilik) / 100, 0);

  const DealCard = ({ d, stage }: { d: PipelineDeal; stage: string }) => (
    <div className={`bg-white rounded-xl border-l-4 ${STAGE_COLORS[stage]} p-4 shadow-sm`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 text-sm truncate">{d.musteriAdi}</p>
          <p className="text-xs text-gray-500 truncate">{d.baslik}</p>
        </div>
        <div className="flex gap-1 ml-2 flex-shrink-0">
          <button onClick={() => openEdit(d)} className="p-1 text-indigo-600 hover:bg-indigo-50 rounded transition"><Edit2 size={13} /></button>
          <button onClick={() => setDeleteId(d.id!)} className="p-1 text-red-500 hover:bg-red-50 rounded transition"><Trash2 size={13} /></button>
        </div>
      </div>
      <div className="flex items-center justify-between text-xs text-gray-500 mt-3">
        <span className="font-semibold text-gray-800">₺{d.deger.toLocaleString("tr-TR")}</span>
        <span>%{d.olasilik}</span>
      </div>
      <div className="mt-2 h-1.5 bg-gray-100 rounded-full">
        <div className="h-1.5 bg-indigo-400 rounded-full" style={{ width: `${d.olasilik}%` }} />
      </div>
      {d.kapanisTarihi && <p className="text-xs text-gray-400 mt-2">Kapanış: {d.kapanisTarihi}</p>}
      {d.sorumlu && <p className="text-xs text-gray-400">Sorumlu: {d.sorumlu}</p>}
    </div>
  );

  return (
    <CrmShell>
      <div className="p-4 md:p-6 max-w-full">
        {/* Header */}
        <div className="flex items-start justify-between mb-6 gap-3">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">Satış Pipeline</h1>
            <p className="text-gray-500 text-sm mt-1">
              Toplam: ₺{totalValue.toLocaleString("tr-TR")} · Ağırlıklı: ₺{Math.round(weightedValue).toLocaleString("tr-TR")}
            </p>
          </div>
          <button onClick={() => openAdd()} className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition shadow flex-shrink-0">
            <Plus size={15} /> <span className="hidden sm:inline">Yeni Fırsat</span><span className="sm:hidden">Ekle</span>
          </button>
        </div>

        {/* Mobile: stage tabs */}
        <div className="md:hidden">
          <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
            {STAGES.map((stage) => {
              const count = deals.filter((d) => d.asama === stage).length;
              const active = mobileStage === stage;
              return (
                <button
                  key={stage}
                  onClick={() => setMobileStage(stage)}
                  className={`flex-shrink-0 px-3 py-2 rounded-xl border text-xs font-medium transition ${
                    active ? STAGE_TAB[stage] + " border-2" : "bg-white border-gray-200 text-gray-600"
                  }`}
                >
                  {stage} ({count})
                </button>
              );
            })}
          </div>
          {/* Mobile single stage view */}
          {(() => {
            const stageDeals = deals.filter((d) => d.asama === mobileStage);
            const stageTotal = stageDeals.reduce((s, d) => s + d.deger, 0);
            return (
              <div>
                <div className={`${STAGE_HEADER[mobileStage]} text-white rounded-xl p-3 mb-3 flex items-center justify-between`}>
                  <div>
                    <p className="font-semibold text-sm">{mobileStage}</p>
                    <p className="text-xs text-white/80">{stageDeals.length} fırsat · ₺{stageTotal.toLocaleString("tr-TR")}</p>
                  </div>
                  <button onClick={() => openAdd(mobileStage)} className="p-1 bg-white/20 rounded-lg hover:bg-white/30 transition">
                    <Plus size={16} />
                  </button>
                </div>
                <div className="space-y-3">
                  {stageDeals.length === 0 ? (
                    <div className="text-center py-10 text-gray-400 bg-white rounded-xl border border-gray-100">Bu aşamada fırsat yok</div>
                  ) : stageDeals.map((d) => (
                    <DealCard key={d.id} d={d} stage={mobileStage} />
                  ))}
                </div>
              </div>
            );
          })()}
        </div>

        {/* Desktop: horizontal kanban */}
        <div className="hidden md:flex gap-4 overflow-x-auto pb-4">
          {STAGES.map((stage) => {
            const stageDeals = deals.filter((d) => d.asama === stage);
            const stageTotal = stageDeals.reduce((s, d) => s + d.deger, 0);
            return (
              <div key={stage} className="flex-shrink-0 w-72">
                <div className={`${STAGE_HEADER[stage]} text-white rounded-xl p-3 mb-3 flex items-center justify-between`}>
                  <div>
                    <p className="font-semibold text-sm">{stage}</p>
                    <p className="text-xs text-white/80">{stageDeals.length} fırsat · ₺{stageTotal.toLocaleString("tr-TR")}</p>
                  </div>
                  <button onClick={() => openAdd(stage)} className="p-1 bg-white/20 rounded-lg hover:bg-white/30 transition">
                    <Plus size={16} />
                  </button>
                </div>
                <div className="space-y-3 min-h-[200px]">
                  {stageDeals.map((d) => (
                    <DealCard key={d.id} d={d} stage={stage} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-semibold">{editId ? "Fırsat Düzenle" : "Yeni Fırsat"}</h2>
              <button onClick={closeForm} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Müşteri Adı *</label>
                <input value={form.musteriAdi} onChange={(e) => F("musteriAdi", e.target.value)} className="input-field" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Fırsat Başlığı</label>
                <input value={form.baslik} onChange={(e) => F("baslik", e.target.value)} className="input-field" placeholder="örn. Schengen Vize Başvurusu" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Aşama</label>
                <select value={form.asama} onChange={(e) => F("asama", e.target.value as PipelineDeal["asama"])} className="input-field">
                  {STAGES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Değer (₺)</label>
                <input type="number" value={form.deger} onChange={(e) => F("deger", Number(e.target.value))} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Olasılık (%{form.olasilik})</label>
                <input type="range" min={0} max={100} value={form.olasilik} onChange={(e) => F("olasilik", Number(e.target.value))} className="w-full accent-indigo-600" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sorumlu</label>
                <input value={form.sorumlu} onChange={(e) => F("sorumlu", e.target.value)} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tahmini Kapanış</label>
                <input type="date" value={form.kapanisTarihi} onChange={(e) => F("kapanisTarihi", e.target.value)} className="input-field" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Notlar</label>
                <textarea value={form.notlar} onChange={(e) => F("notlar", e.target.value)} className="input-field resize-none h-20" />
              </div>
            </div>
            <div className="flex gap-3 justify-end p-5 border-t">
              <button onClick={closeForm} className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm hover:bg-gray-50">İptal</button>
              <button onClick={handleSave} disabled={!form.musteriAdi || saving} className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
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
            <h3 className="font-semibold mb-2">Fırsatı Sil</h3>
            <p className="text-gray-500 text-sm mb-6">Bu fırsatı silmek istediğinizden emin misiniz?</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 border rounded-xl text-sm hover:bg-gray-50">İptal</button>
              <button onClick={() => { deleteRecord("pipeline", deleteId); setDeleteId(null); }} className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700">Sil</button>
            </div>
          </div>
        </div>
      )}
    </CrmShell>
  );
}
