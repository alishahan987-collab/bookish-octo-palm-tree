import Link from "next/link";
import type { ReactNode } from "react";
import { safeHref } from "@/lib/validation";

/**
 * Small, safe formatter for admin-entered text: paragraphs, "## " subheadings,
 * "- " lists, "1. " lists, **bold**, *italic* and [links](/url). It produces React
 * elements only (no raw HTML), so edited content can never inject scripts.
 */
function inline(text: string, key: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)\s]+\))/g;
  let last = 0;
  let i = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const tok = m[0];
    const k = `${key}-${i++}`;
    if (tok.startsWith("**")) out.push(<strong key={k} className="font-semibold">{tok.slice(2, -2)}</strong>);
    else if (tok.startsWith("*")) out.push(<em key={k}>{tok.slice(1, -1)}</em>);
    else {
      const [, label, raw] = /\[([^\]]+)\]\(([^)\s]+)\)/.exec(tok)!;
      const href = safeHref(raw);
      if (!href) out.push(label);
      else if (href.startsWith("/")) out.push(<Link key={k} href={href} className="underline decoration-accent underline-offset-4">{label}</Link>);
      else out.push(<a key={k} href={href} className="underline decoration-accent underline-offset-4" rel="noopener noreferrer" target={href.startsWith("http") ? "_blank" : undefined}>{label}</a>);
    }
    last = m.index + tok.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function Markdown({ source, className = "" }: { source: string; className?: string }) {
  const blocks = (source ?? "").replace(/\r\n/g, "\n").split(/\n{2,}/);
  return (
    <div className={`space-y-4 ${className}`}>
      {blocks.map((block, bi) => {
        const b = block.trim();
        if (!b) return null;
        const k = `b${bi}`;
        if (b.startsWith("### ")) return <h4 key={k} className="!mt-8 text-xl">{inline(b.slice(4), k)}</h4>;
        if (/^#{1,2} /.test(b)) {
          const [first, ...rest] = b.split("\n");
          return (
            <div key={k} className="!mt-9 space-y-3">
              <h3 className="text-2xl md:text-[1.75rem]">{inline(first.replace(/^#{1,2} /, ""), k)}</h3>
              {rest.length > 0 && <p>{inline(rest.join(" "), `${k}r`)}</p>}
            </div>
          );
        }
        const lines = b.split("\n");
        if (lines.every((l) => /^[-*] /.test(l.trim()))) {
          return (
            <ul key={k} className="space-y-2">
              {lines.map((l, i) => (
                <li key={i} className="flex gap-3">
                  <span className="mt-[0.7em] h-1 w-1 flex-none rounded-full bg-accent" aria-hidden="true" />
                  <span>{inline(l.trim().slice(2), `${k}-${i}`)}</span>
                </li>
              ))}
            </ul>
          );
        }
        if (lines.every((l) => /^\d+\. /.test(l.trim()))) {
          return (
            <ol key={k} className="list-decimal space-y-2 pl-5 marker:text-accent-ink">
              {lines.map((l, i) => <li key={i} className="pl-1">{inline(l.trim().replace(/^\d+\. /, ""), `${k}-${i}`)}</li>)}
            </ol>
          );
        }
        return <p key={k}>{inline(lines.join(" "), k)}</p>;
      })}
    </div>
  );
}
