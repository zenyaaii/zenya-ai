/**
 * The icon vocabulary the AI is allowed to choose from.
 *
 * Generators inject ICON_VOCAB_PROMPT into their system/user prompt so the
 * model returns a semantic icon `name` (never an emoji, never freeform). Any
 * value it returns is still run through resolveIcon() at render time, so even
 * an off-list guess degrades to a sensible icon — but giving the model the
 * real menu keeps choices relevant.
 *
 * NOTE: this file intentionally does NOT import ./registry so it can be pulled
 * into server/API prompts without bundling lucide-react. The names below are a
 * curated subset of registry keys; resolveIcon() still accepts the full set.
 */

/** Grouped for readability in the prompt — keys mirror ./registry. */
const GROUPS: Record<string, string[]> = {
  'Food & drink':
    'coffee tea juice wine beer cocktail croissant cake cookie donut ice-cream pizza sandwich burger salad soup meat fish chicken egg breakfast bread grain fruit chef cooking dining utensils table-service grill'.split(' '),
  'Retail & products':
    'shopping-bag cart basket store warehouse package delivered boxes gift tag discount sale ticket receipt apparel gem watch glasses shoes premium luxury'.split(' '),
  'Shipping & travel':
    'shipping delivery flight boat bike car bus train location map directions compass worldwide anchor camping'.split(' '),
  'Money & payments':
    'card wallet cash coins price euro savings bank payment'.split(' '),
  'Trust & benefits':
    'secure shield verified check lock privacy award trophy medal thumbs-up star sparkles bolt fast rocket target performance timer clock hourglass handshake partnership guarantee'.split(' '),
  'Nature & eco':
    'leaf eco sprout pine trees flower blossom recycle water sun moon snow wind waves mountain cloud feather pets'.split(' '),
  'Beauty, health & wellness':
    'haircut brush palette design spa fitness gym heartbeat health clinic medicine injection medical smile dental eye vision mind accessibility baby care love'.split(' '),
  'Home & trades':
    'home building repair tools painting drill measure construction electric idea cooling heating cleaning sanitize pest key door furniture bedroom'.split(' '),
  'Tech & creative':
    'laptop mobile desktop wifi code chip camera video film photo gallery music podcast audio writing book reading education puzzle layers magic wand lens'.split(' '),
  'Contact & UI':
    'phone mail chat message send notify calendar schedule user users community link share search info help quote business document checklist settings'.split(' '),
}

/** Prompt-ready block listing every allowed icon name, grouped by theme. */
export const ICON_VOCAB_PROMPT = [
  'ICON NAMES — choose the single most relevant name for each icon field.',
  'Use ONLY names from this list. Never use emojis, symbols, or freeform text.',
  '',
  ...Object.entries(GROUPS).map(([label, keys]) => `${label}: ${keys.join(', ')}`),
].join('\n')

/** Flattened, de-duplicated list of every name offered to the model. */
export const ALL_ICON_NAMES = Array.from(new Set(Object.values(GROUPS).flat()))
