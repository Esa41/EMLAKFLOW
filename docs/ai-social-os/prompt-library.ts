/**
 * Emlakflow Social OS — Prompt Library (reference implementation)
 * Copy into lib/social-agents/prompts/ when implementing.
 * All user-facing captions default to Turkish; image/video prompts stay English
 * for Midjourney / Flux / Imagen / GPT Image / Ideogram / Veo.
 */

export type AgentKey =
  | "content_writer"
  | "copywriter"
  | "designer"
  | "marketing_strategist"
  | "seo_expert"
  | "video_creator"
  | "social_media_manager"
  | "campaign_planner"
  | "brand_manager"
  | "analytics_expert"
  | "community_manager"
  | "trend_hunter"
  | "competitor_analyst";

export const AGENTS: Record<
  AgentKey,
  { label: string; system: string; tools: string[] }
> = {
  content_writer: {
    label: "Content Writer",
    system: `You are the Content Writer for a Turkish real-estate agency inside Emlakflow OS.
Write platform-native posts. Never invent licenses, square meters, or prices.
Always return the structured ContentAsset JSON contract.
Respect BrandKit voice, forbidden phrases, and emoji policy.`,
    tools: ["getBrandKit", "getListing", "getStrategy"],
  },
  copywriter: {
    label: "Copywriter",
    system: `High-converting real-estate copywriter. Tones: luxury|corporate|friendly|professional|minimal|emotional|urgent|premium|high_converting.
Lead with benefit, proof, scarcity only if true, clear CTA to vitrin or WhatsApp.`,
    tools: ["getBrandKit", "getListing"],
  },
  designer: {
    label: "Designer",
    system: `Art director for property visuals. Produce imagePrompt object with midjourney, flux, imagen, gptImage, ideogram variants.
Prefer photoreal estate photography language. Include lens, lighting, composition. Negative: text, watermark, distorted architecture.`,
    tools: ["getBrandKit", "getListingMedia"],
  },
  marketing_strategist: {
    label: "Marketing Strategist",
    system: `Build pillars, cadence, seasonal hooks for TR/Gulf markets. Output MarketingStrategy JSON cached on BrandKit.`,
    tools: ["getBrandKit", "getTopPosts", "getInventorySummary", "getCityCalendar"],
  },
  seo_expert: {
    label: "SEO Expert",
    system: `Generate seoKeywords and hashtag sets: branded, location, intent (satılık/kiralık), luxury modifiers. Avoid banned/spam tags.`,
    tools: ["getListing", "getCity"],
  },
  video_creator: {
    label: "Video Creator",
    system: `Create Reels/TikTok/Shorts storyboards: hook (0-3s), scenes, camera, transitions, music mood, subtitle script, B-roll, CTA ending.
Align with existing Emlakflow studio concepts: drone|interior|social.`,
    tools: ["getListingMedia", "getStudioTemplates"],
  },
  social_media_manager: {
    label: "Social Media Manager",
    system: `Recommend platforms, best local times (Europe/Istanbul default), mix of formats, approval needs.`,
    tools: ["getBestTimeHeatmap", "getConnectedAccounts", "getQuietHours"],
  },
  campaign_planner: {
    label: "Campaign Planner",
    system: `Build 30/60/90-day plans from inventory, launches, holidays. Balance education / listing / social proof / CTA.`,
    tools: ["getInventorySummary", "getCityCalendar", "getCampaigns"],
  },
  brand_manager: {
    label: "Brand Manager",
    system: `Enforce BrandKit. Reject off-brand claims. Suggest voice corrections.`,
    tools: ["getBrandKit"],
  },
  analytics_expert: {
    label: "Analytics Expert",
    system: `Explain reach/engagement/CTR/leads. Rank top/worst posts. Predict next-week focus.`,
    tools: ["getAnalytics", "getSocialLeads"],
  },
  community_manager: {
    label: "Community Manager",
    system: `Draft comment replies and DM openers that route to CRM without sounding salesy.`,
    tools: ["getBrandKit", "getListing"],
  },
  trend_hunter: {
    label: "Trend Hunter",
    system: `Propose trend-jacking ideas safe for real estate (rates, relocation, interior trends). No political content.`,
    tools: ["getCityCalendar", "getTopPosts"],
  },
  competitor_analyst: {
    label: "Competitor Analyst",
    system: `Analyze competitor frequency, hooks, visuals, hashtags. Recommend differentiated angles — never copy captions verbatim.`,
    tools: ["getCompetitors", "getCompetitorPosts"],
  },
};

/** Vertical content packs */
export const VERTICAL_PACKS = {
  luxury_villa: {
    angles: ["privacy", "view", "craftsmanship", "lifestyle dawn/dusk"],
    cta: "Özel tur için yazın",
  },
  apartment: {
    angles: ["location minutes", "light", "plan efficiency", "investment yield"],
    cta: "Planı inceleyin",
  },
  rental: {
    angles: ["move-in ready", "deposit clarity", "neighborhood living"],
    cta: "Müsaitlik sor",
  },
  commercial: {
    angles: ["foot traffic", "ceiling height", "zoning", "ROI"],
    cta: "Yatırımcı özeti isteyin",
  },
  developer_launch: {
    angles: ["phase progress", "payment plan", "amenities", "delivery date"],
    cta: "Ön talep formunu doldurun",
  },
  open_house: {
    angles: ["date/time", "what to expect", "parking", "RSVP"],
    cta: "Yerinizi ayırtın",
  },
  holiday: {
    angles: ["seasonal living", "gift-of-home", "year-end investment"],
    cta: "Bu sezonki fırsatları görün",
  },
} as const;

export const IMAGE_PROMPT_SCAFFOLDS = {
  luxury_villa:
    "photoreal luxury villa exterior, golden hour, cinematic wide angle 24mm, landscaped mediterranean garden, still water reflection, no people, no text --ar 4:5 --stylize 150",
  apartment:
    "modern apartment living room, soft north light, minimal furniture, architectural photography, correct perspective, no people",
  construction_site:
    "high-end construction progress photo, clean site, safety compliant, crane skyline, documentary realism",
  architecture:
    "award-winning facade detail, concrete and glass, sharp lines, overcast soft light",
  interior_design:
    "interior design magazine shot, staged but livable, warm tungsten accents, shallow depth",
  office:
    "premium office lobby, stone and wood, wayfinding subtle, corporate calm",
  corporate:
    "corporate brand photography, confident negative space for logo safe area",
  luxury_lifestyle:
    "aspirational lifestyle implication without faces, espresso on terrace overlooking sea, bokeh city lights",
  drone:
    "aerial drone orbit of residential project, clear weather, true colors, no warping",
  night_render:
    "photoreal night exterior render, warm window glow, wet streets reflections, luxury residential",
  project_visualization:
    "developer marketing visualization, accurate massing, landscaping mature, twilight",
  investment:
    "clean infographic-ready building hero shot with sky negative space, no fake charts",
  modern_buildings:
    "contemporary residential block, blue hour, symmetrical composition",
  minimal_design:
    "minimal architecture photograph, negative space, muted palette, precise geometry",
} as const;

export const VIDEO_STORYBOARD_SCAFFOLD = {
  hook: "0-3s: bold exterior or reveal with on-screen location line",
  scenes: [
    { t: "3-8s", camera: "slow push-in foyer", purpose: "arrival emotion" },
    { t: "8-15s", camera: "lateral pan living", purpose: "space proof" },
    { t: "15-22s", camera: "detail materials", purpose: "quality" },
    { t: "22-28s", camera: "view / amenity", purpose: "lifestyle" },
  ],
  transitions: "cut on motion + soft light leak; avoid cheesy zooms",
  music: "warm cinematic pulse 90-105 BPM, no copyright-risk pop",
  subtitles: "large TR captions, 4-6 words/line, brand green accent bar",
  broll: "hands on railing, coffee steam, neighborhood walk (stock only if owned)",
  ctaEnding: "logo + WhatsApp / vitrin URL endcard 2s",
} as const;

export function buildGenerationSystemPrompt(input: {
  brandVoice?: string | null;
  tone: string;
  format: string;
  city?: string | null;
  language?: string;
}): string {
  return [
    "Return ONLY valid JSON matching the ContentAsset contract.",
    `Tone: ${input.tone}`,
    `Format: ${input.format}`,
    `Language for caption/headline/cta: ${input.language ?? "tr"}`,
    `City context: ${input.city ?? "Türkiye"}`,
    input.brandVoice ? `Brand voice: ${input.brandVoice}` : "",
    "Image/video prompts must be English.",
    "Never fabricate facts not present in the listing context.",
  ]
    .filter(Boolean)
    .join("\n");
}

export const CONTENT_ASSET_JSON_SCHEMA_HINT = `{
  "headline": "string",
  "caption": "string",
  "cta": "string",
  "emojiStrategy": "string",
  "hashtags": ["string"],
  "seoKeywords": ["string"],
  "imagePrompt": {
    "midjourney": "string",
    "flux": "string",
    "imagen": "string",
    "gptImage": "string",
    "ideogram": "string"
  },
  "videoPrompt": "string",
  "thumbnailIdea": "string",
  "carouselSlides": [{"order": 1, "text": "string", "visual": "string"}],
  "storySequence": [{"order": 1, "text": "string", "durationSec": 5}],
  "postingRecommendation": {
    "platforms": ["INSTAGRAM"],
    "bestTimesLocal": ["18:30"],
    "reason": "string"
  }
}` as const;
