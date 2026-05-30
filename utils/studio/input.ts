import { z } from 'zod'

export const studioInputSchema = z.object({
  brand: z.object({
    name: z.string().min(2),
    tagline: z.string().min(5),
    category: z.string().min(2),
    founded: z.string().optional()
  }),
  mission: z.string().min(20),
  founder_story: z.string().min(20).optional(),
  values: z.array(z.object({
    title: z.string().min(2),
    description: z.string().optional()
  })).min(1).max(5),
  process: z.object({
    description: z.string().optional(),
    steps: z.array(z.string()).min(2).max(6).optional()
  }).optional(),
  team_size: z.string().optional(),
  press_features: z.string().optional(),
  milestones: z.array(z.object({
    year: z.string(),
    event: z.string()
  })).optional(),
  social_proof: z.object({
    customer_count: z.string().optional(),
    repeat_rate: z.string().optional(),
    avg_rating: z.string().optional()
  }).optional(),
  style_preset: z.enum(['ink', 'gold', 'dusk', 'slate']).default('ink')
})

export type StudioInput = z.infer<typeof studioInputSchema>
