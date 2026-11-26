import Link from "next/link";
import type { ReactNode } from "react";
import type { Link as LinkT, Spacing, Tone } from "@/lib/types";
import { isExternal } from "@/lib/validation";
import { Icon } from "./Icon";

export function Section({ tone, spacing, anchor, children, className = "", id }: { tone: Tone; spacing: Spacing; anchor?: string; children: ReactNode; className?: string; id?: string }) {
  const pad = spacing === "compact" ? "section-compact" : spacing === "airy" ? "section-airy" : "section";
  return (
    <section id={anchor || undefined} data-block={id} className={`tone-${tone} ${pad} ${className}`}>
      {children}
    </section>
  );
}

export function Heading({ eyebrow, title, intro, center, as = "h2" }: { eyebrow?: string; title?: string; intro?: string; center?: boolean; as?: "h1" | "h2" }) {
  if (!eyebrow && !title && !intro) return null;
  const H = as;
  return (
    <div className={`mb-10 max-w-2xl md:mb-14 ${center ? "mx-auto text-center" : ""}`}>
      {eyebrow && <p className="eyebrow mb-4">{eyebrow}</p>}
      {title && <H className={as === "h1" ? "text-[2.6rem] leading-[1.05] sm:text-5xl md:text-6xl" : "text-[2.1rem] sm:text-4xl md:text-[2.9rem]"}>{title}</H>}
      {intro && <p className="mt-5 text-[1.05rem] text-fg-muted">{intro}</p>}
    </div>
  );
}

/** Button-styled link. Internal paths use client navigation; others open safely. */
export function ButtonLink({ link, variant = "primary", className = "", icon }: { link: LinkT; variant?: "primary" | "outline"; className?: string; icon?: string }) {
  if (!link.href || !link.label) return null;
  const cls = `btn btn-${variant} ${className}`;
  const inner = (
    <>
      {icon && <Icon name={icon} size={16} />}
      {link.label}
    </>
  );
  if (link.href.startsWith("/")) return <Link href={link.href} className={cls}>{inner}</Link>;
  return (
    <a href={link.href} className={cls} {...(isExternal(link.href) ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
      {inner}
    </a>
  );
}

export function TextLink({ link, className = "" }: { link: LinkT; className?: string }) {
  if (!link.href || !link.label) return null;
  const cls = `inline-flex items-center gap-2 text-sm font-semibold tracking-wide text-fg ${className}`;
  const inner = (
    <>
      <span className="link-underline pb-0.5">{link.label}</span>
      <Icon name="arrow" size={16} />
    </>
  );
  return link.href.startsWith("/") ? <Link href={link.href} className={cls}>{inner}</Link> : <a href={link.href} className={cls} target={isExternal(link.href) ? "_blank" : undefined} rel="noopener noreferrer">{inner}</a>;
}
