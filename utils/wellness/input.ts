import { z } from 'zod'

const treatmentSchema = z.object({
  name: z.string().min(2),
  category: z.string().optional(),
  duration: z.string().optional(),
  price: z.string().optional(),
  description: z.string().optional(),
  badge: z.string().optional()
})

const teamMemberSchema = z.object({
  name: z.string().min(2),
  title: z.string().optional(),
  specialty: z.string().optional(),
  bio: z.string().optional(),
  image_url: z.string().url().optional()
})

export const wellnessInputSchema = z.object({
  brand: z.object({
    name: z.string().min(2),
    type: z.string().min(2),
    city: z.string().min(2),
    region: z.string().optional(),
    founded_year: z.string().optional()
  }),
  contact: z.object({
    phone: z.string().min(4),
    email: z.string().email(),
    address: z.string().optional(),
    booking_url: z.string().url().optional(),
    hours: z.string().optional(),
    cancellation_policy: z.string().optional()
  }),
  treatments: z.array(treatmentSchema).min(1),
  team: z.array(teamMemberSchema).optional().default([]),
  philosophy: z.object({
    brief: z.string().min(20),
    approach: z.string().optional(),
    mission_seed: z.string().optional()
  }),
  amenities: z.string().optional(),
  social_proof: z.object({
    review_rating: z.number().min(1).max(5).optional(),
    review_count: z.string().optional(),
    certifications: z.string().optional()
  }).optional().default({}),
  visuals: z.object({
    hero_image_url: z.string().url().optional(),
    space_image_urls: z.string().optional(),
    team_image_url: z.string().url().optional()
  }).optional().default({}),
  style_preset: z.enum(['zen', 'bloom', 'forest', 'noir']).default('zen')
})

export type WellnessInput = z.infer<typeof wellnessInputSchema>
