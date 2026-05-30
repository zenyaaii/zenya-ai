export type StudioStylePresetId = 'ink' | 'gold' | 'dusk' | 'slate'

export type StudioColors = {
  primary: string
  accent: string
  accentMuted: string
  background: string
  surface: string
  surfaceAlt: string
  text: string
  muted: string
  border: string
  overlay: string
  gradient: string
  glowAccent: string
}

export type StudioTimelineEvent = {
  year: string
  title: string
  description: string
}

export type StudioValue = {
  number: string
  title: string
  body: string
}

export type StudioTeamMember = {
  name: string
  role: string
  bio: string
  avatar_letter: string
}

export type StudioPressItem = {
  publication: string
  quote: string
  year?: string
}

export type StudioContent = {
  brand: {
    name: string
    tagline: string
    category: string
    founded: string
  }
  hero: {
    eyebrow: string
    manifesto: string
    subheadline: string
    cta_primary: string
    cta_secondary: string
  }
  mission: {
    statement: string
    elaboration: string
  }
  founder_letter: {
    eyebrow: string
    heading: string
    paragraphs: string[]
    signature: string
    signature_role: string
  }
  timeline: {
    eyebrow: string
    heading: string
    events: StudioTimelineEvent[]
  }
  values: {
    eyebrow: string
    heading: string
    subheading: string
    items: StudioValue[]
  }
  process: {
    eyebrow: string
    heading: string
    body: string
    steps: { title: string; description: string }[]
  }
  team: {
    eyebrow: string
    heading: string
    subheading: string
    members: StudioTeamMember[]
  }
  press: {
    heading: string
    items: StudioPressItem[]
  }
  community: {
    eyebrow: string
    heading: string
    subheading: string
    stats: { value: string; label: string }[]
  }
  cta: {
    eyebrow: string
    heading: string
    subheading: string
    cta_primary: string
    cta_secondary: string
  }
  footer: {
    tagline: string
    legal: string
    email: string
  }
  seo: {
    title: string
    description: string
  }
}
