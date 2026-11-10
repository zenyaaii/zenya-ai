"use client"

import ServicesPreview from '@/components/theme/services/ServicesPreview'
import { barberDemoContent } from '@/utils/services/barber-demo'

const content = barberDemoContent()

/** The barber kind of the services template, on made-up content. */
export default function BarberDemoPage() {
  return <ServicesPreview content={content} presetId="graphite" />
}
