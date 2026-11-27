/**
 * «فاحص بينون» — the QA agent's reference layer. See docs/qa-agent.md.
 *
 *   reference.ts      what a site must and must not show, from what it was built from
 *   design-system.ts  Beynoun's own palette and the four information shapes
 *   color.ts          ΔE2000, blends, contrast
 *   flight.ts         reading a page's own props back out of its HTML
 */
export * from './color'
export * from './design-system'
export * from './reference'
export * from './flight'
