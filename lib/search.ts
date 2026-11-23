import type { Condition, Post, SearchHit, Treatment } from "./data/types";

/**
 * Lightweight site search (runs in the browser, no external service).
 * Field-weighted scoring, prefix matching, typo tolerance and patient-language
 * synonyms ("hair fall", "pimples", "dark spots"...).
 */

const SYNONYMS: Record<string, string[]> = {
  pimples: ["acne"], pimple: ["acne"], spots: ["acne", "pigmentation"], zits: ["acne"], breakouts: ["acne"],
  "hair fall": ["hair loss"], hairfall: ["hair loss"], baldness: ["hair loss"], alopecia: ["hair loss"], thinning: ["hair loss"],
  "dark spots": ["pigmentation", "hyperpigmentation", "melasma"], darkspots: ["hyperpigmentation"], freckles: ["pigmentation"],
  "dark patches": ["melasma"], chaiyan: ["melasma"], whitening: ["pigmentation"], fairness: ["pigmentation"], tan: ["pigmentation"],
  wrinkles: ["botox", "anti-ageing", "anti-aging"], lines: ["botox"], ageing: ["anti-ageing", "anti-aging"], aging: ["anti-ageing", "anti-aging"],
  "anti wrinkle": ["botox"], lips: ["lip fillers"], volume: ["fillers"], glow: ["hydrafacial", "skin boosters"],
  scars: ["acne scars"], marks: ["hyperpigmentation", "acne scars"], itching: ["eczema", "allergies", "fungal"], rash: ["eczema", "allergies", "fungal"],
  ringworm: ["fungal"], tinea: ["fungal"], flakes: ["dandruff"], white: ["vitiligo"], patches: ["vitiligo", "melasma"], redness: ["rosacea"],
  laser: ["laser"], prp: ["prp"], peel: ["peels"], facial: ["hydrafacial"],
};

export interface SearchDoc {
  type: SearchHit["type"];
  title: string;
  href: string;
  summary: string;
  keywords: string;
  body: string;
  image?: string;
}

const norm = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, " ").replace(/\s+/g, " ").trim();
const words = (s: string) => norm(s).split(" ").filter((w) => w.length > 1);

function lev1(a: string, b: string): boolean {
  if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0, j = 0, edits = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) { i++; j++; continue; }
    if (++edits > 1) return false;
    if (a.length > b.length) i++;
    else if (b.length > a.length) j++;
    else { i++; j++; }
  }
  return edits + (a.length - i) + (b.length - j) <= 1;
}

export function buildIndex(data: { treatments: Treatment[]; conditions: Condition[]; posts: Post[] }): SearchDoc[] {
  const docs: SearchDoc[] = [];
  for (const t of data.treatments) {
    docs.push({
      type: "procedure", title: t.name, href: `/treatments/${t.slug}`, summary: t.shortDescription, image: t.image,
      keywords: [t.tagline, t.category, ...t.concerns.map((c) => c.replace(/-/g, " "))].join(" "),
      body: [t.description, ...t.benefits, ...t.suitableFor, ...t.faqs.map((f) => f.q)].join(" "),
    });
  }
  for (const c of data.conditions) {
    docs.push({
      type: "condition", title: c.name, href: `/conditions/${c.slug}`, summary: c.summary, image: c.image,
      keywords: [...c.symptoms, ...c.causes].join(" "),
      body: [c.overview, ...c.treatments].join(" "),
    });
  }
  for (const p of data.posts) {
    docs.push({ type: "article", title: p.title, href: `/blog/${p.slug}`, summary: p.excerpt, image: p.cover, keywords: p.tags.join(" "), body: p.content.slice(0, 4000) });
  }
  const pages: [string, string, string][] = [
    ["About the doctor", "/about", "doctor qualifications experience biography"],
    ["Book an appointment", "/book", "book appointment booking schedule consultation"],
    ["Pricing", "/pricing", "price cost fees rates packages discounts offers"],
    ["Before & after gallery", "/before-after", "results before after photos gallery"],
    ["Contact us", "/contact", "contact phone email whatsapp address location map timings hours"],
    ["Skin Concern Finder", "/skin-finder", "which treatment finder quiz concern"],
  ];
  for (const [title, href, keywords] of pages) docs.push({ type: "page", title, href, summary: "", keywords, body: "" });
  return docs;
}

export function search(index: SearchDoc[], query: string, limit = 20): SearchHit[] {
  const q = norm(query);
  if (q.length < 2) return [];
  const extra = Object.entries(SYNONYMS).filter(([k]) => q.includes(k)).flatMap(([, v]) => v);
  const terms = [...new Set([...words(q), ...extra.flatMap(words)])];
  const phrase = q;

  const hits: SearchHit[] = [];
  for (const d of index) {
    const fields: [string, number][] = [[norm(d.title), 10], [norm(d.keywords), 4], [norm(d.summary), 3], [norm(d.body), 1]];
    let score = 0;
    let matchedTerms = 0;
    for (const term of terms) {
      let best = 0;
      for (const [text, w] of fields) {
        if (!text) continue;
        if (new RegExp(`\\b${term.replace(/[-]/g, "\\-")}`).test(text)) best = Math.max(best, w);
        else if (term.length >= 5 && text.split(" ").some((tw) => tw.length >= 4 && lev1(tw, term))) best = Math.max(best, w * 0.6);
      }
      if (best > 0) matchedTerms++;
      score += best;
    }
    if (norm(d.title).includes(phrase)) score += 15;
    if (score > 0 && matchedTerms > 0) {
      const typeBoost = d.type === "condition" || d.type === "procedure" ? 1.1 : 1;
      hits.push({ type: d.type, title: d.title, href: d.href, snippet: d.summary, image: d.image, score: score * typeBoost * (matchedTerms / terms.length + 0.5) });
    }
  }
  return hits.sort((a, b) => b.score - a.score).slice(0, limit);
}
