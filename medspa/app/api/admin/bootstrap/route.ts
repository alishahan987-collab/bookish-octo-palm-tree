import { repo } from "@/lib/repo";
import { withAdmin } from "@/lib/server/admin";
import { ok } from "@/lib/server/http";

/** Everything the dashboard edits, including hidden and unpublished items. */
export const GET = withAdmin(async (_req, admin) => {
  const [settings, design, navigation, pages, treatments, testimonials, gallery] = await Promise.all([
    repo.getDoc("settings"), repo.getDoc("design"), repo.getDoc("navigation"),
    repo.list("pages"), repo.list("treatments"), repo.list("testimonials"), repo.list("gallery"),
  ]);
  return ok({ user: admin, mode: repo.mode, settings, design, navigation, pages, treatments, testimonials, gallery });
});
