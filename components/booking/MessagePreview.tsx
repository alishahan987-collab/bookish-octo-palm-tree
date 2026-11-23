import type { MessagePreview as Preview } from "@/lib/messages";
import { Icon } from "../ui/Icon";

/**
 * Shows exactly what WILL be sent in Phase 2. Nothing is sent from the prototype.
 */
export function MessagePreview({ preview, title = "Message preview" }: { preview: Preview; title?: string }) {
  return (
    <section className="rounded-3xl border border-dashed border-champagne bg-cream/60 p-5 sm:p-6" aria-label={title} data-testid="message-preview">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="font-sans text-base font-semibold text-charcoal">{title}</h3>
        <span className="chip border border-champagne bg-ivory text-gold-deep">Preview only · not sent</span>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        This is the message the system will send automatically once WhatsApp Business and email are connected (Phase 2). In this design preview, nothing is sent.
      </p>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {preview.whatsapp && (
          <div className="overflow-hidden rounded-2xl border border-line bg-[#efe7dc]">
            <div className="flex items-center gap-2 bg-[#1f5c45] px-4 py-2.5 text-sm font-semibold text-white">
              <Icon name="whatsapp" size={18} /> WhatsApp
            </div>
            <div className="p-4">
              <div className="relative max-w-[95%] rounded-xl rounded-tl-none bg-white p-3 text-[0.85rem] leading-relaxed text-[#1d1d1d] shadow-sm">
                <p className="whitespace-pre-line">{renderWa(preview.whatsapp)}</p>
                <p className="mt-1 text-right text-[0.65rem] text-[#667]">preview</p>
              </div>
            </div>
          </div>
        )}
        {preview.email && (
          <div className="overflow-hidden rounded-2xl border border-line bg-white">
            <div className="flex items-center gap-2 border-b border-line bg-ivory px-4 py-2.5 text-sm font-semibold text-charcoal">
              <Icon name="mail" size={18} className="text-gold" /> Email
            </div>
            <div className="p-4 text-[0.85rem] leading-relaxed">
              <p className="text-xs text-muted">Subject</p>
              <p className="font-semibold text-charcoal">{preview.email.subject}</p>
              <p className="mt-3 whitespace-pre-line text-ink">{preview.email.body}</p>
            </div>
          </div>
        )}
      </div>
      {!preview.whatsapp && !preview.email && <p className="mt-4 text-sm text-muted">No contact method available for this appointment.</p>}
    </section>
  );
}

/** Render WhatsApp *bold* markup. */
function renderWa(text: string) {
  return text.split(/(\*[^*]+\*)/g).map((part, i) =>
    part.startsWith("*") && part.endsWith("*") ? <strong key={i}>{part.slice(1, -1)}</strong> : <span key={i}>{part}</span>,
  );
}
