# Zenya System Changelog & Architecture Updates

This document tracks all modifications to the Zenya AI system, specifically focusing on the transition from "Hardcoded" defaults to "Fully Dynamic AI-Generated" content.

## System State Before Edits (Feb 15, 2026)
- **API (`app/api/generate-content`)**: 
  - Generates ~16 sections (Hero, Features, Testimonials, etc.).
  - Misses functional sections (Contact, Upsell, Trust Badges, etc.).
  - Hardcoded fallback data exists but is generic.
- **Generator (`utils/shopify-generator.ts`)**:
  - Uses hardcoded strings for many section settings (e.g., `default: "Frequently Bought Together"`).
  - Contains some outdated Liquid code (e.g., invalid preset names).
  - Does not fully utilize the AI's potential for niche-specific copy.

## Updates

### Phase 1: AI Brain Expansion (Current Task)
- [ ] Update `app/api/generate-content/route.ts` to include prompts for:
  - Contact Section (Heading, Subheading)
  - Upsell Section (Heading)
  - Volume Bundles (Heading, Tier Labels)
  - Countdown Banner (Heading, Timer Text)
  - Logo List (Heading)
  - Before/After (Heading, Labels)
  - Stats (Values, Labels)
  - Visual Showcase (Heading, Subheading)
  - How It Works (Steps)
  - Trust Badges (Heading)
  - Accordion (Titles, Content)
  - Tabs (Titles, Content)

### Phase 2: Blueprint Update
- [ ] Update `ThemeContent` interface in `utils/shopify-generator.ts` to support new fields.

### Phase 3: Generator Wiring
- [ ] Replace hardcoded strings in `utils/shopify-generator.ts` with `content.section.field`.
- [ ] Sync corrected Liquid code from `shopify-theme/` folder to `utils/shopify-generator.ts`.
