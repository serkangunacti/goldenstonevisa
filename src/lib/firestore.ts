import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  orderBy,
  Timestamp,
  onSnapshot,
} from "firebase/firestore";
import { db } from "./firebase";

// ── Types ──────────────────────────────────────────────────────────────────

export type CustomerStatus = "Yeni" | "Devam Ediyor" | "Olumlu" | "Olumsuz" | "Beklemede";
export type PaymentStatus = "Ödendi" | "Bekliyor" | "Kısmi";
export type LeadStatus = "Yeni" | "İletişime Geçildi" | "Nitelikli" | "Teklif Verildi" | "Kazanıldı" | "Kaybedildi";
export type PipelineStage = "Farkındalık" | "İlgi" | "Değerlendirme" | "Karar" | "Satın Alma";
export type TaskStatus = "Bekliyor" | "Devam Ediyor" | "Tamamlandı";
export type TaskPriority = "Düşük" | "Orta" | "Yüksek";

export interface Customer {
  id?: string;
  ad: string;
  musteriTipi: string;
  vizeTipi: string;
  hedefUlke: string;
  botKullanimi: boolean;
  botUcreti: number;
  islemAsamasi: CustomerStatus;
  odemeDurumu: PaymentStatus;
  odemetutari: number;
  notlar?: string;
  olusturmaTarihi?: Timestamp;
}

export interface Lead {
  id?: string;
  ad: string;
  email: string;
  telefon: string;
  ilgiAlani: string;
  hedefUlke: string;
  durum: LeadStatus;
  kaynak: string;
  notlar?: string;
  tahminiDeger: number;
  olusturmaTarihi?: Timestamp;
}

export interface PipelineDeal {
  id?: string;
  musteriAdi: string;
  baslik: string;
  asama: PipelineStage;
  deger: number;
  olasilik: number;
  sorumlu: string;
  kapanisTarihi: string;
  notlar?: string;
  olusturmaTarihi?: Timestamp;
}

export interface Task {
  id?: string;
  baslik: string;
  aciklama: string;
  atanan: string;
  ilgiliMusteri?: string;
  oncelik: TaskPriority;
  durum: TaskStatus;
  sonTarih: string;
  olusturmaTarihi?: Timestamp;
}

// ── Generic CRUD ────────────────────────────────────────────────────────────

export async function addRecord<T extends object>(col: string, data: T) {
  return addDoc(collection(db, col), { ...data, olusturmaTarihi: Timestamp.now() });
}

export async function updateRecord<T extends object>(col: string, id: string, data: Partial<T>) {
  return updateDoc(doc(db, col, id), data as Record<string, unknown>);
}

export async function deleteRecord(col: string, id: string) {
  return deleteDoc(doc(db, col, id));
}

export async function getRecords<T>(col: string): Promise<T[]> {
  const q = query(collection(db, col), orderBy("olusturmaTarihi", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as T));
}

export function subscribeToCollection<T>(
  col: string,
  callback: (data: T[]) => void
) {
  const q = query(collection(db, col), orderBy("olusturmaTarihi", "desc"));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as T)));
  });
}
