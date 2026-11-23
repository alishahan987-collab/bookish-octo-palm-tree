import type { ReactNode } from "react";

export function SectionHeading({
  eyebrow,
  title,
  children,
  align = "left",
  id,
}: {
  eyebrow?: string;
  title: ReactNode;
  children?: ReactNode;
  align?: "left" | "center";
  id?: string;
}) {
  return (
    <div className={align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h2 id={id} className="mt-3 text-[2.1rem] leading-[1.05] sm:text-5xl">
        {title}
      </h2>
      {children && <div className="mt-4 text-[1.02rem] leading-relaxed text-muted">{children}</div>}
    </div>
  );
}

/** Dashed box used wherever the clinic must supply real content. */
export function Placeholder({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-dashed border-sand bg-cream/60 p-5 text-sm leading-relaxed text-muted ${className}`}>
      {children}
    </div>
  );
}
