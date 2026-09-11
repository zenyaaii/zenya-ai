/**
 * The pricing page — the house style applied to the one surface that
 * takes money.
 *
 * Design read: a price list is a receipt, not a pitch. Three keys laid on one
 * flat ground, and the only colour in the room is on the one you are meant to
 * press. Materials come from docs/zenya-hero-style.md; the theatre does not.
 *
 * Three decisions, all made by rendering candidates on the real page rather
 * than by reasoning about them:
 *
 *   - NO AMBIENT WASH. The live page carries AuroraBackground: three blurred
 *     orbs, fixed, drifting under the whole document. The style refuses
 *     gradients on anything that is not the light itself, and records that the
 *     light belongs to the hero rather than sitting under the whole site for
 *     ever. A scoped violet band was rendered as a candidate anyway and it
 *     tinted the paper cards lilac so they stopped reading as paper. The
 *     ground here is one flat colour with nothing in it, and the page stands
 *     on a single soft-cornered panel over it.
 *
 *   - IT SCROLLS, it is not a deck. A deck is a pitch instrument. This is a
 *     reference document people read line by line, deep-link into and search
 *     with Cmd+F. What is borrowed from the deck is its stillness, and its
 *     header.
 *
 *   - THE MIDDLE CARD IS OBSIDIAN. This is ادر's inversion, which the style
 *     doc records as its ONE exception to the achromatic rule, "because it is
 *     the inside of the product rather than the paper the product is drawn
 *     on". A plan you buy is the inside of the product. Same values as the
 *     manage panel: #131316 ground, #5e6ad2 fill, #97a0ee for type and
 *     hairlines, because the flat primary falls under 4.5:1 on that ground.
 *     Measured on it: 7.58:1 label, 7.32:1 secondary, 15.18:1 features.
 *
 * Four candidates were rejected, and the reasons are worth keeping because
 * each cost a render pass:
 *
 *   - Hairline cards with no fill dissolved the two outer plans into the
 *     paper. On a page whose whole job is comparison, losing the column
 *     boundary is a functional loss, not a stylistic one.
 *   - Inverting PRO instead put the black on the most expensive plan while
 *     Starter still carried the badge: two emphases, and a reader who cannot
 *     tell what they are being told.
 *   - A violet rail down the leading edge read as a divider, which the style
 *     refuses as decoration.
 *   - Standing the featured card taller broke the top alignment of the three
 *     prices. That one scan line is the most important comparison on the page.
 *
 * THE KEY RECIPE IS SCOPED TO THE BUTTONS. The doc's six-layer key is the
 * deliberate exception to the no-shadows rule, and it says plainly that
 * content never does this. So a card is not a key. Cards take the ring token;
 * only what is pressable is a key.
 *
 * Every number here is the one the rest of the codebase charges: Entry $0.50
 * once, Starter $14.99/mo, Pro $24.99/mo. Nothing on this page is invented:
 * no counts, no ratings, no "trusted by". The comparison table's rows are
 * copied verbatim from the live page, because a claim about a competitor that
 * nobody has checked is not a design decision.
 */

import PricingView from "@/components/zenya/pricing/PricingView"

export default function PricingPage() {
  return <PricingView />
}
