"use client";

import { useState } from "react";
import { validateContact, type FieldErrors } from "@/lib/validation";
import { Icon } from "../ui/Icon";

export function ContactForm() {
  const [f, setF] = useState({ name: "", email: "", phone: "", subject: "", message: "", website: "" });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState("");

  const set = (k: keyof typeof f, v: string) => {
    setF((x) => ({ ...x, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const errs = validateContact(f);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setState("sending");
    try {
      const res = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (json.fields) setErrors(json.fields);
        setError(json.error || "Your message could not be sent. Please call us.");
        setState("idle");
        return;
      }
      setState("sent");
    } catch {
      setError("Network problem. Please try again or call us.");
      setState("idle");
    }
  }

  if (state === "sent") {
    return (
      <div role="status" className="mt-6 flex gap-3 rounded-md bg-alt/60 p-5" data-testid="contact-success">
        <Icon name="check" size={20} className="mt-0.5 flex-none" />
        <p>Thank you. Your message has been sent and we will get back to you as soon as possible.</p>
      </div>
    );
  }

  const field = (k: "name" | "email" | "phone" | "subject", label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div>
      <label htmlFor={`ct-${k}`} className="field-label">{label}</label>
      <input id={`ct-${k}`} className="field" value={f[k]} onChange={(e) => set(k, e.target.value)} aria-invalid={Boolean(errors[k])} aria-describedby={errors[k] ? `ct-${k}-err` : undefined} {...props} />
      {errors[k] && <p id={`ct-${k}-err`} className="field-error">{errors[k]}</p>}
    </div>
  );

  return (
    <form onSubmit={submit} noValidate className="mt-6 grid gap-5 sm:grid-cols-2">
      {field("name", "Name", { autoComplete: "name", maxLength: 100 })}
      {field("email", "Email", { type: "email", autoComplete: "email", inputMode: "email", maxLength: 200 })}
      {field("phone", "Phone (optional)", { type: "tel", autoComplete: "tel", inputMode: "tel", maxLength: 30 })}
      {field("subject", "Subject (optional)", { maxLength: 150 })}
      <div className="sm:col-span-2">
        <label htmlFor="ct-message" className="field-label">Message</label>
        <textarea id="ct-message" className="field min-h-[140px]" value={f.message} onChange={(e) => set("message", e.target.value)} maxLength={3000} aria-invalid={Boolean(errors.message)} aria-describedby={errors.message ? "ct-message-err" : undefined} />
        {errors.message && <p id="ct-message-err" className="field-error">{errors.message}</p>}
        <p className="mt-2 text-xs text-fg-muted">Please don&apos;t include detailed medical information. We will discuss it with you in person.</p>
      </div>
      <div className="hidden" aria-hidden="true">
        <input tabIndex={-1} autoComplete="off" value={f.website} onChange={(e) => set("website", e.target.value)} aria-label="Website" />
      </div>
      {error && <p className="field-error sm:col-span-2" role="alert">{error}</p>}
      <div className="sm:col-span-2">
        <button type="submit" className="btn btn-primary w-full sm:w-auto" disabled={state === "sending"}>
          {state === "sending" ? "Sending…" : "Send message"}
        </button>
      </div>
    </form>
  );
}
