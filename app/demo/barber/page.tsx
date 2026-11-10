"use client"

import ServicesPreview from '@/components/theme/services/ServicesPreview'
import { nicheDemoContent } from '@/utils/services/niche-demo'

const content = nicheDemoContent('barber')

/** The barber kind of the services template, on made-up content. */
export default function BarberDemoPage() {
  return <ServicesPreview content={content} presetId="graphite" />
}
