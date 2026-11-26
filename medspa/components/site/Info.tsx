import { formatTime, WEEKDAYS } from "@/lib/dates";
import type { Settings, SocialLink } from "@/lib/types";
import { safeHref } from "@/lib/validation";
import { Icon } from "../ui/Icon";

export function HoursList({ settings, compact }: { settings: Settings; compact?: boolean }) {
  const hours = settings.business.hours;
  return (
    <dl className={`grid grid-cols-[auto_1fr] gap-x-6 ${compact ? "gap-y-1 text-sm" : "gap-y-2"}`}>
      {WEEKDAYS.map((d) => {
        const h = hours.find((x) => x.day === d.id);
        return (
          <div key={d.id} className="contents">
            <dt className="text-fg-muted">{d.long}</dt>
            <dd className="text-right tabular-nums">{!h || h.closed ? "Closed" : `${formatTime(h.open)} – ${formatTime(h.close)}`}</dd>
          </div>
        );
      })}
    </dl>
  );
}

export function SocialLinks({ links, size = 18, className = "" }: { links: SocialLink[]; size?: number; className?: string }) {
  const valid = links.filter((l) => safeHref(l.url));
  if (!valid.length) return null;
  return (
    <ul className={`flex flex-wrap gap-2 ${className}`}>
      {valid.map((l) => (
        <li key={l.id}>
          <a
            href={safeHref(l.url)}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={l.label || l.platform}
            title={l.label || l.platform}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-line transition-colors hover:border-accent hover:text-accent-ink"
          >
            <Icon name={l.platform} size={size} />
          </a>
        </li>
      ))}
    </ul>
  );
}

export function Stars({ rating, size = 15 }: { rating: number; size?: number }) {
  return (
    <span className="inline-flex text-accent" aria-hidden="true">
      {[1, 2, 3, 4, 5].map((i) => (
        <Icon key={i} name="star" size={size} style={{ opacity: rating >= i - 0.25 ? 1 : 0.25 }} />
      ))}
    </span>
  );
}

export function RatingBadge({ settings, className = "" }: { settings: Settings; className?: string }) {
  const r = settings.reviews;
  if (!r.showBadge || !r.rating || !r.count) return null;
  const href = safeHref(r.googleUrl);
  const content = (
    <>
      <Icon name="google" size={18} />
      <span className="font-semibold tabular-nums">{r.rating.toFixed(1)}</span>
      <Stars rating={r.rating} />
      <span className="text-fg-muted">{r.count.toLocaleString("en-US")} Google reviews</span>
    </>
  );
  const cls = `inline-flex flex-wrap items-center gap-x-2 gap-y-1 text-sm ${className}`;
  return href ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className={`${cls} hover:underline`} aria-label={`Rated ${r.rating.toFixed(1)} out of 5 from ${r.count} Google reviews. Read reviews on Google`}>
      {content}
    </a>
  ) : (
    <p className={cls}>{content}</p>
  );
}
