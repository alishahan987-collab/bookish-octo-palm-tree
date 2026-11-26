import type { JourneyStep, Treatment } from "./data/types";

import { uid } from "./id";

const sid = (i: number) => uid(`st${i}`);

/**
 * Suggested week-by-week plan for a treatment. The provider edits it before
 * saving; these are scheduling templates, not clinical protocols.
 */
export function suggestJourneySteps(t: Pick<Treatment, "slug" | "category" | "name">): JourneyStep[] {
  const make = (rows: [number, string, string][]) =>
    rows.map(([week, title, detail], i) => ({ id: sid(i), week, title, detail, done: false }));

  if (t.slug === "laser-hair-removal") {
    return make([
      [0, "Patch test & session 1", "Skin-type assessment and first session."],
      [5, "Session 2", "Adjust settings based on response."],
      [10, "Session 3", ""],
      [15, "Session 4", ""],
      [20, "Session 5", ""],
      [25, "Session 6 & review", "Review progress and decide on top-up sessions."],
    ]);
  }
  if (t.category === "skin" || t.category === "injectables" || t.category === "laser") {
    return make([
      [0, "Consultation & first treatment", "Assessment, skincare advice and first session if suitable."],
      [3, "Treatment 2", "Check skin response and sun-protection routine."],
      [6, "Treatment 3", ""],
      [9, "Treatment 4", ""],
      [12, "Review", "Review progress and agree next steps or maintenance."],
    ]);
  }
  return make([
    [0, "Consultation", "Discuss goals and agree a plan."],
    [2, "Treatment", "First treatment session."],
    [6, "Review", "Follow-up and next steps."],
  ]);
}
