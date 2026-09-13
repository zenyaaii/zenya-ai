/** What kind of site a theme row is, and where its editor lives. */

export type ThemeRow = {
  id: string
  product_name: string | null
  created_at: string
  updated_at?: string | null
  slug?: string | null
  is_published?: boolean | null
  template_type?: string | null
  content?: any
  view_count?: number | null
}

export const HOSTABLE_TYPES = new Set(['restaurant', 'atlas', 'lookbook', 'wellness', 'studio', 'services'])
export const SHOPIFY_TYPES = new Set(['one_product', 'storefront', 'collective'])

const TEMPLATE_LABEL: Record<string, string> = {
  one_product: 'شوبيفاي',
  storefront: 'شوبيفاي',
  collective: 'شوبيفاي',
  restaurant: 'مطعم',
  atlas: 'تطبيق',
  lookbook: 'أزياء',
  studio: 'ستوديو',
  services: 'خدمات',
  wellness: 'عافية',
}

export function businessTypeOf(t: ThemeRow): string {
  return (t.content && typeof t.content === 'object' && t.content.business_type) || t.template_type || 'one_product'
}

export function templateLabel(bt: string): string {
  return TEMPLATE_LABEL[bt] || bt
}

/** Brochure themes have an in-app editor; Shopify themes open their preview. */
export function editUrlFor(id: string, bt: string): string {
  return HOSTABLE_TYPES.has(bt) ? `/preview/${bt}/${id}/edit` : `/preview/${id}`
}
