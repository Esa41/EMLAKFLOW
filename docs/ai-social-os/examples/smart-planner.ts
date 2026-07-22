/**
 * Smart Planner — builds 30/60/90-day slot skeletons.
 * Target: lib/social/planner.ts
 */

export type PlanHorizon = 30 | 60 | 90;

export type PlanSlot = {
  dayOffset: number;
  platform: "INSTAGRAM" | "FACEBOOK" | "LINKEDIN" | "GOOGLE_BUSINESS";
  format: "FEED_POST" | "CAROUSEL" | "REEL" | "STORY" | "LINKEDIN_POST" | "GBP_POST";
  pillar: "listing" | "education" | "social_proof" | "brand" | "cta" | "seasonal";
  localTime: string; // HH:mm
};

const WEEKLY_CADENCE: Omit<PlanSlot, "dayOffset">[] = [
  { platform: "INSTAGRAM", format: "REEL", pillar: "listing", localTime: "12:30" },
  { platform: "INSTAGRAM", format: "CAROUSEL", pillar: "education", localTime: "18:30" },
  { platform: "INSTAGRAM", format: "STORY", pillar: "cta", localTime: "20:00" },
  { platform: "FACEBOOK", format: "FEED_POST", pillar: "listing", localTime: "13:00" },
  { platform: "LINKEDIN", format: "LINKEDIN_POST", pillar: "brand", localTime: "09:30" },
  { platform: "INSTAGRAM", format: "FEED_POST", pillar: "social_proof", localTime: "19:00" },
  { platform: "GOOGLE_BUSINESS", format: "GBP_POST", pillar: "cta", localTime: "11:00" },
];

/** TR-centric light holiday hooks — expand via API later */
const SEASONAL_HOOKS: Record<string, string> = {
  "01-01": "Yeni yıl, yeni adres",
  "04-23": "Bahar taşınma ritmi",
  "07-15": "Yazlık ilgi artışı",
  "10-29": "Cumhuriyet haftası vitrin",
  "11-24": "Black Friday yatırım iletişimi (ihtiyatlı)",
};

export function buildSmartPlan(input: {
  horizonDays: PlanHorizon;
  start: Date;
  listingHeavy?: boolean;
}): PlanSlot[] {
  const slots: PlanSlot[] = [];
  for (let d = 0; d < input.horizonDays; d++) {
    const template = WEEKLY_CADENCE[d % WEEKLY_CADENCE.length];
    // Listing-heavy agencies: replace education with listing 2x/week
    const pillar =
      input.listingHeavy && template.pillar === "education" && d % 14 < 7
        ? "listing"
        : template.pillar;

    const date = new Date(input.start);
    date.setDate(date.getDate() + d);
    const key = `${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    const seasonal = SEASONAL_HOOKS[key];

    slots.push({
      dayOffset: d,
      platform: template.platform,
      format: template.format,
      pillar: seasonal ? "seasonal" : pillar,
      localTime: template.localTime,
    });
  }
  return slots;
}
