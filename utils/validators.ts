import { z } from 'zod'

export const scrapeInputSchema = z.object({
  url: z.string().url()
})

export const generateContentSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  audience: z.string().optional()
})

export const themeCreateSchema = z.object({
  productUrl: z.string().url(),
  productName: z.string().min(2),
  images: z.array(z.string().url()).min(1),
  primaryColor: z.string().min(4),
  secondaryColor: z.string().min(4),
  content: z.record(z.any()) // Allow flexible content structure for new theme sections
})
