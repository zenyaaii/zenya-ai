import { z } from 'zod'

export const lookbookInputSchema = z.object({
  brand: z.object({
    name: z.string().min(2),
    tagline: z.string().min(3),
    category: z.string().min(2)
  }),
  style_direction: z.string().min(10),
  target_customer: z.string().min(10),
  collection_name: z.string().optional(),
  collection_season: z.string().optional(),
  products: z.array(z.object({
    name: z.string().min(2),
    price: z.string().optional(),
    category: z.string().optional()
  })).min(3).max(8),
  brand_story: z.string().min(20).optional(),
  sustainability_focus: z.boolean().default(false),
  press_features: z.string().optional(),
  social_proof: z.object({
    review_count: z.string().optional(),
    review_rating: z.number().optional()
  }).optional(),
  style_preset: z.enum(['noir', 'blush', 'earth', 'void']).default('noir')
})

export type LookbookInput = z.infer<typeof lookbookInputSchema>
