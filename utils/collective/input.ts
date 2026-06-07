import { z } from 'zod'

export const collectiveInputSchema = z.object({
  brand: z.object({
    name: z.string().min(2),
    tagline: z.string().min(5),
    description: z.string().min(10)
  }),
  categories: z.array(z.string()).min(1).max(8),
  collections: z.array(z.object({
    name: z.string().min(2),
    tagline: z.string().optional()
  })).min(1).max(6),
  price_range: z.object({
    min: z.string().optional(),
    max: z.string().optional(),
    average: z.string().optional()
  }).optional(),
  curation_story: z.string().min(20).optional(),
  sustainability: z.boolean().default(false),
  shipping_perks: z.string().optional(),
  returns_policy: z.string().optional(),
  social_proof: z.object({
    review_count: z.string().optional(),
    review_rating: z.number().optional(),
    customer_count: z.string().optional()
  }).optional(),
  style_preset: z.enum(['jade', 'dusk', 'pearl', 'iris']).default('jade')
})

export type CollectiveInput = z.infer<typeof collectiveInputSchema>
