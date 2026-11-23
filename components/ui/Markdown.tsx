import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Small, safe Markdown renderer for articles: headings, paragraphs, lists,
 * blockquotes, bold, italic and links. Produces React elements (no raw HTML),
 * so admin-entered content cannot inject scripts.
 */
function inline(text: string, keyPrefix: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const tok = m[0];
    const key = `${keyPrefix}-${i++}`;
    if (tok.startsWith("**")) out.push(<strong key={key} className="font-semibold text-charcoal">{tok.slice(2, -2)}</strong>);
    else if (tok.startsWith("*")) out.push(<em key={key}>{tok.slice(1, -1)}</em>);
    else {
      const [, label, href] = /\[([^\]]+)\]\(([^)]+)\)/.exec(tok)!;
      const safe = /^(https?:\/\/|\/|mailto:|tel:)/.test(href) ? href : "#";
      out.push(
        safe.startsWith("/") ? (
          <Link key={key} href={safe} className="font-medium text-gold underline underline-offset-4">{label}</Link>
        ) : (
          <a key={key} href={safe} className="font-medium text-gold underline underline-offset-4" rel="noopener noreferrer" target="_blank">{label}</a>
        ),
      );
    }
    last = m.index + tok.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function Markdown({ source }: { source: string }) {
  const blocks = source.replace(/\r\n/g, "\n").split(/\n{2,}/);
  return (
    <div className="space-y-5 text-[1.04rem] leading-[1.8] text-ink">
      {blocks.map((block, bi) => {
        const b = block.trim();
        if (!b) return null;
        const key = `b${bi}`;
        if (b.startsWith("### ")) return <h3 key={key} className="!mt-9 text-2xl">{inline(b.slice(4), key)}</h3>;
        if (b.startsWith("## ")) return <h2 key={key} className="!mt-11 text-3xl">{inline(b.slice(3), key)}</h2>;
        if (b.startsWith("# ")) return <h2 key={key} className="!mt-11 text-3xl">{inline(b.slice(2), key)}</h2>;
        if (b.startsWith("> ")) return <blockquote key={key} className="border-l-2 border-champagne pl-5 font-serif text-xl italic text-charcoal">{inline(b.replace(/^> ?/gm, ""), key)}</blockquote>;
        const lines = b.split("\n");
        if (lines.every((l) => /^[-*] /.test(l.trim()))) {
          return (
            <ul key={key} className="space-y-2.5 pl-1">
              {lines.map((l, i) => (
                <li key={i} className="flex gap-3"><span className="mt-3 h-1.5 w-1.5 flex-none rounded-full bg-champagne" aria-hidden="true" /><span>{inline(l.trim().slice(2), `${key}-${i}`)}</span></li>
              ))}
            </ul>
          );
        }
        if (lines.every((l) => /^\d+\. /.test(l.trim()))) {
          return (
            <ol key={key} className="list-decimal space-y-2.5 pl-6 marker:font-semibold marker:text-gold">
              {lines.map((l, i) => <li key={i} className="pl-1">{inline(l.trim().replace(/^\d+\. /, ""), `${key}-${i}`)}</li>)}
            </ol>
          );
        }
        return <p key={key}>{inline(lines.join(" "), key)}</p>;
      })}
    </div>
  );
}
