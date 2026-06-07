import { z } from 'zod'

export const serviceInputSchema = z.object({
  brand: z.object({
    name: z.string().min(2).max(80),
    category: z.string().min(2).max(80),
    city: z.string().min(2).max(60),
    region: z.string().max(80).optional(),
    owner_name: z.string().max(80).optional(),
    years_in_business: z.string().max(40).optional()
  }),
  contact: z.object({
    phone: z.string().min(4).max(40),
    email: z.string().email().max(120),
    address: z.string().max(200).optional(),
    booking_url: z.string().url().max(500).optional(),
    emergency_service: z.boolean().default(false),
    availability: z.string().max(120).optional(),
    response_time: z.string().max(120).optional()
  }),
  services: z
    .array(
      z.object({
        name: z.string().min(2).max(80),
        description: z.string().max(260).optional(),
        price_from: z.string().max(40).optional(),
        badge: z.string().max(24).optional()
      })
    )
    .min(1)
    .max(12),
  areas_served: z.array(z.string().min(2).max(60)).max(12).optional().default([]),
  differentiators: z.array(z.string().min(4).max(120)).max(8).optional().default([]),
  story: z.object({
    brief: z.string().min(20).max(900),
    owner_title: z.string().max(80).optional(),
    quote_seed: z.string().max(240).optional()
  }),
  visuals: z.object({
    hero_image_url: z.string().url().max(800).optional(),
    team_image_url: z.string().url().max(800).optional(),
    before_image_url: z.string().url().max(800).optional(),
    after_image_url: z.string().url().max(800).optional(),
    gallery_image_urls: z.array(z.string().url().max(800)).max(8).optional()
  }),
  social_proof: z.object({
    review_rating: z.number().min(0).max(5).optional(),
    review_count: z.string().max(40).optional(),
    licenses: z.array(z.string().min(2).max(80)).max(6).optional(),
    guarantees: z.array(z.string().min(2).max(120)).max(6).optional(),
    promo_offer: z.string().max(180).optional()
  }),
  style_preset: z.enum(['cobalt', 'graphite', 'amber', 'emerald']).default('cobalt')
})

export type ServiceInput = z.infer<typeof serviceInputSchema>
