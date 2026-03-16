"use client";

import CrmShell from "@/components/crm/CrmShell";
import { useEffect, useState } from "react";
import { Plus, X, Trash2, Edit2, UserCheck, UserX, RefreshCw, Eye, EyeOff } from "lucide-react";

interface CrmUser {
  uid: string;
  email: string;
  displayName: string;
  disabled: boolean;
  createdAt: string;
  lastLogin: string;
}

const EMPTY = { email: "", password: "", displayName: "" };

export default function UsersPage() {
  const [users, setUsers] = useState<CrmUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState<CrmUser | null>(null);
  const [form, setForm] = useState({ ...EMPTY });
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteUid, setDeleteUid] = useState<string | null>(null);
  const [error, setError] = useState("");

  const fetchUsers = async () => {
    setLoading(true);
    const res = await fetch("/api/users");
    const data = await res.json();
    setUsers(data.users || []);
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const openAdd = () => { setForm({ ...EMPTY }); setEditUser(null); setError(""); setShowForm(true); };
  const openEdit = (u: CrmUser) => {
    setForm({ email: u.email, password: "", displayName: u.displayName });
    setEditUser(u);
    setError("");
    setShowForm(true);
  };
  const closeForm = () => { setShowForm(false); setEditUser(null); };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      if (editUser) {
        const res = await fetch("/api/users", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uid: editUser.uid, ...form }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
      } else {
        const res = await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
      }
      closeForm();
      fetchUsers();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Bir hata oluştu");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (uid: string) => {
    await fetch("/api/users", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uid }),
    });
    setDeleteUid(null);
    fetchUsers();
  };

  const toggleDisable = async (u: CrmUser) => {
    await fetch("/api/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uid: u.uid, disabled: !u.disabled }),
    });
    fetchUsers();
  };

  const F = (k: keyof typeof form, v: string) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <CrmShell>
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Kullanıcı Yönetimi</h1>
            <p className="text-gray-500 text-sm mt-1">{users.length} kullanıcı</p>
          </div>
          <div className="flex gap-3">
            <button onClick={fetchUsers} className="p-2.5 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition">
              <RefreshCw size={16} />
            </button>
            <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition shadow">
              <Plus size={16} /> Yeni Kullanıcı
            </button>
          </div>
        </div>

        {/* User list */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="text-center py-16">
              <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-gray-400 text-sm">Yükleniyor...</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {["#", "Ad Soyad", "E-posta", "Son Giriş", "Durum", "İşlem"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-12 text-gray-400">Kullanıcı bulunamadı</td></tr>
                ) : users.map((u, i) => (
                  <tr key={u.uid} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{u.displayName || "—"}</td>
                    <td className="px-4 py-3 text-gray-600">{u.email}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString("tr-TR") : "Hiç giriş yapılmadı"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${u.disabled ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                        {u.disabled ? "Pasif" : "Aktif"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(u)} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition" title="Düzenle">
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => toggleDisable(u)} className={`p-1.5 rounded-lg transition ${u.disabled ? "text-green-600 hover:bg-green-50" : "text-amber-600 hover:bg-amber-50"}`} title={u.disabled ? "Aktif et" : "Pasif et"}>
                          {u.disabled ? <UserCheck size={14} /> : <UserX size={14} />}
                        </button>
                        <button onClick={() => setDeleteUid(u.uid)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition" title="Sil">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-semibold">{editUser ? "Kullanıcı Düzenle" : "Yeni Kullanıcı Ekle"}</h2>
              <button onClick={closeForm} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ad Soyad</label>
                <input value={form.displayName} onChange={(e) => F("displayName", e.target.value)} className="input-field" placeholder="Ad Soyad" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">E-posta *</label>
                <input type="email" value={form.email} onChange={(e) => F("email", e.target.value)} className="input-field" placeholder="kullanici@goldstonevisa.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Şifre {editUser && <span className="text-gray-400 font-normal">(boş bırakırsan değişmez)</span>}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={(e) => F("password", e.target.value)}
                    className="input-field pr-12"
                    placeholder={editUser ? "Yeni şifre (isteğe bağlı)" : "En az 6 karakter"}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>
            <div className="flex gap-3 justify-end p-6 border-t">
              <button onClick={closeForm} className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm hover:bg-gray-50">İptal</button>
              <button
                onClick={handleSave}
                disabled={!form.email || (!editUser && !form.password) || saving}
                className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
              >
                {saving ? "Kaydediliyor..." : "Kaydet"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteUid && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center">
            <Trash2 size={40} className="text-red-500 mx-auto mb-4" />
            <h3 className="font-semibold mb-2">Kullanıcıyı Sil</h3>
            <p className="text-gray-500 text-sm mb-6">Bu kullanıcı kalıcı olarak silinecek. Emin misiniz?</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteUid(null)} className="flex-1 py-2.5 border rounded-xl text-sm hover:bg-gray-50">İptal</button>
              <button onClick={() => handleDelete(deleteUid)} className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700">Sil</button>
            </div>
          </div>
        </div>
      )}
    </CrmShell>
  );
}
