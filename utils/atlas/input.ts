import { z } from 'zod'

export const atlasInputSchema = z.object({
  brand: z.object({
    name: z.string().min(2),
    tagline: z.string().min(5),
    category: z.string().min(2)
  }),
  target_audience: z.string().min(10),
  problem_solved: z.string().min(10),
  features: z.array(z.object({
    title: z.string().min(2),
    description: z.string().optional()
  })).min(1).max(6),
  integrations: z.array(z.string()).optional(),
  pricing: z.object({
    free_tier: z.boolean().default(true),
    pro_price: z.string().optional(),
    enterprise: z.boolean().default(true)
  }).optional(),
  social_proof: z.object({
    user_count: z.string().optional(),
    review_rating: z.number().optional(),
    review_count: z.string().optional(),
    notable_customers: z.string().optional()
  }).optional(),
  style_preset: z.enum(['orbit', 'midnight', 'aurora', 'carbon']).default('orbit')
})

export type AtlasInput = z.infer<typeof atlasInputSchema>
