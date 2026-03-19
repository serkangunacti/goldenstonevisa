"use client";

import { useEffect, useState } from "react";
import { TrendingUp, RefreshCw } from "lucide-react";

interface Rates {
  USD: { effectiveSelling: string };
  EUR: { effectiveSelling: string };
  date: string;
}

function formatRate(val: string) {
  const num = parseFloat(val.replace(",", "."));
  if (isNaN(num)) return "—";
  return num.toLocaleString("tr-TR", { minimumFractionDigits: 4, maximumFractionDigits: 4 });
}

export default function ExchangeRateBanner() {
  const [rates, setRates] = useState<Rates | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<string>("");

  const fetchRates = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/exchange-rates");
      if (res.ok) {
        const data = await res.json();
        if (!data.error) {
          setRates(data);
          setLastUpdate(new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }));
        }
      }
    } catch {
      // sessiz hata
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRates();
    // Her 5 dakikada bir güncelle
    const interval = setInterval(fetchRates, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-purple-700 px-4 md:px-6 py-2.5 flex items-center justify-between gap-4 shadow-md">
      {/* Sol: Başlık */}
      <div className="flex items-center gap-2">
        <TrendingUp size={16} className="text-indigo-200 flex-shrink-0" />
        <span className="text-indigo-100 text-xs font-medium whitespace-nowrap hidden sm:inline">
          TCMB Efektif Satış
        </span>
        <span className="text-indigo-100 text-xs font-medium sm:hidden">Kur</span>
      </div>

      {/* Sağ: Kurlar */}
      <div className="flex items-center gap-4 md:gap-6">
        {loading && !rates ? (
          <span className="text-indigo-200 text-xs animate-pulse">Yükleniyor...</span>
        ) : rates ? (
          <>
            <div className="flex items-baseline gap-1.5">
              <span className="text-indigo-200 text-xs font-medium">USD</span>
              <span className="text-white text-sm font-bold">
                ₺{formatRate(rates.USD.effectiveSelling)}
              </span>
            </div>
            <div className="w-px h-4 bg-white/20" />
            <div className="flex items-baseline gap-1.5">
              <span className="text-indigo-200 text-xs font-medium">EUR</span>
              <span className="text-white text-sm font-bold">
                ₺{formatRate(rates.EUR.effectiveSelling)}
              </span>
            </div>
            {lastUpdate && (
              <>
                <div className="w-px h-4 bg-white/20 hidden md:block" />
                <button
                  onClick={fetchRates}
                  className="hidden md:flex items-center gap-1 text-indigo-200 hover:text-white transition text-xs"
                  title="Güncelle"
                >
                  <RefreshCw size={11} className={loading ? "animate-spin" : ""} />
                  <span>{lastUpdate}</span>
                </button>
              </>
            )}
          </>
        ) : (
          <span className="text-indigo-200 text-xs">Kur verisi alınamadı</span>
        )}
      </div>
    </div>
  );
}
