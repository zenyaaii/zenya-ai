import { z } from 'zod'

export const scrapeInputSchema = z.object({
  url: z.string().url()
})

export const generateContentSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  audience: z.string().optional(),
  productUrl: z.string().url().optional(),
  price: z.number().positive().optional(),
  originalPrice: z.number().positive().optional(),
  productFacts: z
    .object({
      title: z.string().optional(),
      metaDescription: z.string().optional(),
      highlights: z.array(z.string()).optional(),
      specs: z.record(z.string()).optional(),
      brand: z.string().optional(),
      sku: z.string().optional(),
      priceCurrency: z.string().optional(),
      availability: z.string().optional(),
      ratingValue: z.number().optional(),
      reviewCount: z.number().optional(),
      longDescription: z.string().optional(),
    })
    .optional(),
})

export const themeCreateSchema = z.object({
  productUrl: z.string().url().optional().or(z.literal('')),
  productName: z.string().min(2),
  images: z.array(z.string().url()).optional().default([]),
  primaryColor: z.string().min(4),
  secondaryColor: z.string().min(4),
  content: z.record(z.any()) // Allow flexible content structure for new theme sections
})
