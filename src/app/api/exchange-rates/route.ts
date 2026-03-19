import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function extractCurrencyBlock(xml: string, code: string): string {
  const match = xml.match(
    new RegExp(`<Currency[^>]*CurrencyCode="${code}"[^>]*>([\\s\\S]*?)</Currency>`)
  );
  return match ? match[1] : "";
}

function extractTag(block: string, tag: string): string {
  const match = block.match(new RegExp(`<${tag}>([^<]+)</${tag}>`));
  return match ? match[1].trim() : "";
}

async function fetchFromTCMB(): Promise<{ USD: string; EUR: string } | null> {
  try {
    const res = await fetch("https://www.tcmb.gov.tr/kurlar/today.xml", {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; goldenstonevisa-crm/1.0)",
        "Accept": "text/xml, application/xml",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) return null;

    const xml = await res.text();
    const usdBlock = extractCurrencyBlock(xml, "USD");
    const eurBlock = extractCurrencyBlock(xml, "EUR");

    const usd = extractTag(usdBlock, "EffectiveSelling") || extractTag(usdBlock, "ForexSelling");
    const eur = extractTag(eurBlock, "EffectiveSelling") || extractTag(eurBlock, "ForexSelling");

    if (!usd || !eur) return null;

    return { USD: usd, EUR: eur };
  } catch {
    return null;
  }
}

async function fetchFromFallback(): Promise<{ USD: string; EUR: string } | null> {
  try {
    // USD/TRY ve EUR/TRY kuru
    const res = await fetch("https://open.er-api.com/v6/latest/TRY", {
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) return null;

    const data = await res.json();
    if (!data.rates) return null;

    // TRY bazlı → 1 USD kaç TRY
    const usdRate = 1 / data.rates["USD"];
    const eurRate = 1 / data.rates["EUR"];

    return {
      USD: usdRate.toFixed(4),
      EUR: eurRate.toFixed(4),
    };
  } catch {
    return null;
  }
}

export async function GET() {
  let rates = await fetchFromTCMB();
  let source = "TCMB";

  if (!rates) {
    rates = await fetchFromFallback();
    source = "Piyasa";
  }

  if (!rates) {
    return NextResponse.json({ error: "Kur verisi alınamadı" }, { status: 500 });
  }

  const now = new Date();
  const date = now.toLocaleDateString("tr-TR");

  return NextResponse.json({
    USD: { effectiveSelling: rates.USD },
    EUR: { effectiveSelling: rates.EUR },
    date,
    source,
  });
}
