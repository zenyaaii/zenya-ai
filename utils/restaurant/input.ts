import { z } from 'zod'

export const restaurantInputSchema = z.object({
  brand: z.object({
    name: z.string().min(2).max(80),
    cuisine: z.string().min(2).max(60),
    city: z.string().min(2).max(60),
    neighborhood: z.string().max(60).optional()
  }),
  location: z.object({
    address: z.string().min(4).max(200),
    phone: z.string().min(4).max(40),
    email: z.string().email().max(120),
    map_link: z.string().url().max(500).optional(),
    hours: z
      .array(
        z.object({
          day: z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']),
          label: z.string().min(2).max(20),
          open: z.string().max(20),
          close: z.string().max(20),
          closed: z.boolean().optional()
        })
      )
      .length(7)
  }),
  menu: z.object({
    categories: z
      .array(
        z.object({
          name: z.string().min(2).max(40),
          description: z.string().max(160).optional(),
          items: z
            .array(
              z.object({
                name: z.string().min(2).max(80),
                description: z.string().max(220).optional(),
                price: z.string().min(1).max(30),
                badge: z.string().max(20).optional()
              })
            )
            .min(1)
            .max(20)
        })
      )
      .min(1)
      .max(8)
  }),
  story: z.object({
    brief: z.string().min(10).max(800),
    chef_name: z.string().max(80).optional(),
    chef_title: z.string().max(80).optional(),
    chef_bio_brief: z.string().max(500).optional()
  }),
  reservations: z.object({
    provider_type: z.enum(['opentable', 'resy', 'sevenrooms', 'phone', 'form']),
    provider_value: z.string().max(300).optional(),
    note: z.string().max(300).optional()
  }),
  visuals: z.object({
    hero_image_url: z.string().url().max(800).optional(),
    chef_photo_url: z.string().url().max(800).optional(),
    accent_image_url: z.string().url().max(800).optional(),
    gallery_image_urls: z.array(z.string().url().max(800)).max(12).optional(),
    signature_dish_image_urls: z.array(z.string().url().max(800)).max(8).optional()
  }),
  press_outlets: z.array(z.string().min(2).max(60)).max(8).optional(),
  style_preset: z.enum(['onyx', 'trattoria', 'coastal', 'forest']).default('onyx')
})

export type RestaurantInput = z.infer<typeof restaurantInputSchema>
