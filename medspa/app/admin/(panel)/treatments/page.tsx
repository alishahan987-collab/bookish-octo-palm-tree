"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAdmin, useData } from "@/components/admin/store";
import { Badge, Modal, PageTitle, SortableList, Text, btn, inputCls, useToast } from "@/components/admin/ui";
import { newId, slugify } from "@/lib/id";
import type { Treatment } from "@/lib/types";

function blankTreatment(name: string, category: string): Treatment {
  return {
    id: newId("t"), slug: slugify(name), name, category, shortDescription: "", description: "", imageAlt: "", benefits: [], benefitsVerified: false,
    duration: "", price: "", priceNote: "", sections: [], faqs: [], bookingMinutes: 60, bookable: true, booksyUrl: "", verified: false,
    featured: false, published: false, seoTitle: "", seoDescription: "", order: 0, updatedAt: new Date().toISOString(),
  };
}

export default function TreatmentsList() {
  const { treatments, settings } = useData();
  const { saveItem, deleteItem, reorder } = useAdmin();
  const toast = useToast();
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [prices, setPrices] = useState<Record<string, string>>({});

  const save = async (t: Treatment, msg: string) => {
    try {
      await saveItem("treatments", t);
      toast(msg);
    } catch (e) {
      toast((e as Error).message, "error");
    }
  };

  async function create(from?: Treatment) {
    const base = from ? { ...structuredClone(from), id: newId("t"), name: `${from.name} (copy)`, published: false, order: 0 } : blankTreatment(name || "New treatment", settings.treatmentCategories[0] ?? "");
    let slug = from ? `${from.slug}-copy` : base.slug || "new-treatment";
    for (let n = 2; treatments.some((t) => t.slug === slug); n++) slug = `${base.slug || "treatment"}-${n}`;
    try {
      const saved = await saveItem("treatments", { ...base, slug });
      toast(from ? "Duplicated (hidden until published)." : "Treatment created (hidden until published).");
      router.push(`/admin/treatments/${saved.id}`);
    } catch (e) {
      toast((e as Error).message, "error");
    }
  }

  return (
    <>
      <PageTitle
        title="Treatments & prices"
        description="Add, edit, hide, duplicate, reorder or delete treatments. Change a price right here and press Enter (or the tick) to save it."
        actions={<button type="button" className={btn.primary} onClick={() => { setName(""); setCreating(true); }}>+ New treatment</button>}
      />
      <SortableList
        items={treatments}
        onReorder={(next) => reorder("treatments", next).catch((e) => toast(e.message, "error"))}
        render={(t, handle) => {
          const price = prices[t.id] ?? t.price;
          return (
            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-stone-200 bg-white p-2 pr-3 shadow-sm md:flex-nowrap" data-treatment-row={t.slug}>
              {handle}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {t.image ? <img src={t.image} alt="" className="h-14 w-14 flex-none rounded-md object-cover" /> : <span className="h-14 w-14 flex-none rounded-md bg-stone-100" />}
              <Link href={`/admin/treatments/${t.id}`} className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-1.5 font-medium">
                  {t.name}
                  {!t.published && <Badge tone="amber">Hidden</Badge>}
                  {t.verified ? <Badge tone="green">Verified</Badge> : <Badge tone="amber">Not verified</Badge>}
                  {t.featured && <Badge tone="blue">Featured</Badge>}
                </span>
                <span className="block text-xs text-stone-500">{t.category} · /treatments/{t.slug}</span>
              </Link>
              <form className="flex items-center gap-1" onSubmit={(e) => { e.preventDefault(); save({ ...t, price }, "Price saved."); setPrices((p) => { const n = { ...p }; delete n[t.id]; return n; }); }}>
                <input className={`${inputCls} !w-36`} value={price} placeholder={settings.treatmentText.priceFallback} onChange={(e) => setPrices((p) => ({ ...p, [t.id]: e.target.value }))} aria-label={`Price for ${t.name}`} />
                {price !== t.price && <button type="submit" className={btn.primary} aria-label="Save price">✓</button>}
              </form>
              <div className="flex flex-wrap gap-1">
                <Link href={`/admin/treatments/${t.id}`} className={btn.secondary}>Edit</Link>
                <button type="button" className={btn.ghost} onClick={() => save({ ...t, published: !t.published }, t.published ? "Hidden from the website." : "Published.")}>{t.published ? "Hide" : "Publish"}</button>
                <button type="button" className={btn.ghost} onClick={() => create(t)}>Duplicate</button>
                <button type="button" className={`${btn.ghost} text-red-700`} onClick={async () => { if (confirm(`Delete "${t.name}"? Existing appointments keep their details.`)) { try { await deleteItem("treatments", t.id); toast("Deleted."); } catch (e) { toast((e as Error).message, "error"); } } }}>Delete</button>
              </div>
            </div>
          );
        }}
      />
      <Modal open={creating} onClose={() => setCreating(false)} title="New treatment" footer={<><button type="button" className={btn.secondary} onClick={() => setCreating(false)}>Cancel</button><button type="button" className={btn.primary} disabled={!name.trim()} onClick={() => create()}>Create</button></>}>
        <Text label="Treatment name" value={name} onChange={setName} placeholder="e.g. Chemical peel" />
      </Modal>
    </>
  );
}
