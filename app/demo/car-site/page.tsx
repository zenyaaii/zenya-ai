"use client"

import ServicesPreview from '@/components/theme/services/ServicesPreview'
import { nicheDemoContent } from '@/utils/services/niche-demo'

const content = nicheDemoContent('car')

/** The barber kind of the services template, on made-up content. */
export default function Demo() {
  return <ServicesPreview content={content} presetId="graphite" />
}
