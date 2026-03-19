import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function extractTag(xml: string, tag: string): string {
  const match = xml.match(new RegExp(`<${tag}>([^<]*)</${tag}>`));
  return match ? match[1].trim() : "";
}

function extractCurrencyBlock(xml: string, code: string): string {
  const match = xml.match(
    new RegExp(`<Currency[^>]*CurrencyCode="${code}"[^>]*>([\\s\\S]*?)</Currency>`)
  );
  return match ? match[1] : "";
}

export async function GET() {
  try {
    const res = await fetch("https://www.tcmb.gov.tr/kurlar/today.xml", {
      headers: { "Accept": "text/xml" },
      next: { revalidate: 300 }, // 5 dakika cache
    });

    if (!res.ok) throw new Error("TCMB yanıt vermedi");

    const xml = await res.text();

    const usdBlock = extractCurrencyBlock(xml, "USD");
    const eurBlock = extractCurrencyBlock(xml, "EUR");

    // Tarih
    const dateMatch = xml.match(/Date="([^"]+)"/);
    const date = dateMatch ? dateMatch[1] : "";

    return NextResponse.json({
      USD: {
        effectiveSelling: extractTag(usdBlock, "EffectiveSelling"),
        forexSelling: extractTag(usdBlock, "ForexSelling"),
      },
      EUR: {
        effectiveSelling: extractTag(eurBlock, "EffectiveSelling"),
        forexSelling: extractTag(eurBlock, "ForexSelling"),
      },
      date,
    });
  } catch {
    return NextResponse.json({ error: "Kur verisi alınamadı" }, { status: 500 });
  }
}
