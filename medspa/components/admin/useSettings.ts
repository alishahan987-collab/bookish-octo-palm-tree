"use client";

import { useState } from "react";
import type { Settings } from "@/lib/types";
import { useAdmin, useData } from "./store";
import { useDraft, useToast } from "./ui";

/** Shared draft + save for the settings document (used by several admin pages). */
export function useSettingsDraft() {
  const data = useData();
  const { saveDoc } = useAdmin();
  const toast = useToast();
  const d = useDraft<Settings>(data.settings);
  const [saving, setSaving] = useState(false);
  async function save() {
    setSaving(true);
    try {
      await saveDoc("settings", d.draft);
      toast("Saved. The website is updated.");
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setSaving(false);
    }
  }
  return { ...d, saving, save };
}
