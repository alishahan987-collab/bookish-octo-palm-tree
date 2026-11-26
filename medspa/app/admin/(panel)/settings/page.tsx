"use client";

import { useSettingsDraft } from "@/components/admin/useSettings";
import { Area, Card, Grid, ImagePicker, Notice, PageTitle, SaveBar, StringList, Text, Toggle } from "@/components/admin/ui";

export default function SettingsPage() {
  const { draft, setDraft, dirty, reset, saving, save } = useSettingsDraft();
  return (
    <>
      <PageTitle title="SEO & site settings" description="Search engine defaults, announcement bar, categories and labels." />
      <div className="space-y-6">
        <Card title="Search engines">
          <div className="rounded-lg border border-stone-200 p-4">
            <Toggle label="Allow Google and other search engines to index the website" checked={draft.seo.indexable} onChange={(v) => setDraft({ ...draft, seo: { ...draft.seo, indexable: v } })} hint="Keep this off until the business has reviewed the content, then switch it on at launch." />
          </div>
          {!draft.seo.indexable && <Notice>Indexing is off: the site is hidden from Google (noindex). Remember to switch it on at launch.</Notice>}
          <Text label="Text added after every page title" value={draft.seo.titleSuffix} onChange={(v) => setDraft({ ...draft, seo: { ...draft.seo, titleSuffix: v } })} hint='e.g. "Laser Hair Removal in Hollywood, FL | MEDSPA Skincare & Body · Hollywood, FL"' />
          <Area label="Default description" value={draft.seo.defaultDescription} onChange={(v) => setDraft({ ...draft, seo: { ...draft.seo, defaultDescription: v } })} rows={3} hint={`${draft.seo.defaultDescription.length}/155`} />
          <ImagePicker label="Default social sharing image" value={draft.seo.ogImage} onChange={(v) => setDraft({ ...draft, seo: { ...draft.seo, ogImage: v } })} />
        </Card>

        <Card title="Announcement bar" description="A thin bar above the header, e.g. for a seasonal offer.">
          <Toggle label="Show the announcement bar" checked={draft.announcement.enabled} onChange={(v) => setDraft({ ...draft, announcement: { ...draft.announcement, enabled: v } })} />
          <Grid>
            <Text label="Text" value={draft.announcement.text} onChange={(v) => setDraft({ ...draft, announcement: { ...draft.announcement, text: v } })} />
            <Text label="Link (optional)" value={draft.announcement.href} onChange={(v) => setDraft({ ...draft, announcement: { ...draft.announcement, href: v } })} placeholder="/book" />
          </Grid>
        </Card>

        <Card title="Categories">
          <Grid>
            <StringList label="Treatment categories" values={draft.treatmentCategories} onChange={(v) => setDraft({ ...draft, treatmentCategories: v })} />
            <StringList label="Before & after categories" values={draft.galleryCategories} onChange={(v) => setDraft({ ...draft, galleryCategories: v })} />
          </Grid>
        </Card>

        <Card title="Treatment labels">
          <Grid>
            <Text label="Text when no price is set" value={draft.treatmentText.priceFallback} onChange={(v) => setDraft({ ...draft, treatmentText: { ...draft.treatmentText, priceFallback: v } })} />
            <Text label="Book button" value={draft.treatmentText.bookLabel} onChange={(v) => setDraft({ ...draft, treatmentText: { ...draft.treatmentText, bookLabel: v } })} />
            <Text label="'Learn more' link" value={draft.treatmentText.detailsLabel} onChange={(v) => setDraft({ ...draft, treatmentText: { ...draft.treatmentText, detailsLabel: v } })} />
          </Grid>
          <Area label="Notice on treatments not yet verified" value={draft.treatmentText.unverifiedNotice} onChange={(v) => setDraft({ ...draft, treatmentText: { ...draft.treatmentText, unverifiedNotice: v } })} rows={2} />
        </Card>
      </div>
      <SaveBar dirty={dirty} saving={saving} onSave={save} onReset={reset} />
    </>
  );
}
