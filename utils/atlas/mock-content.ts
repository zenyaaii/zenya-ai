import type { AtlasContent } from './types'

export const ATLAS_MOCK_CONTENT: AtlasContent = {
  brand: {
    name: 'Streamline',
    tagline: 'Ship faster, together.',
    category: 'Project Management'
  },
  hero: {
    eyebrow: 'Now in public beta · Join 4,200+ teams',
    headline: 'The project tool\nyour team will\nactually use.',
    subheadline:
      'Streamline replaces your chaotic stack with one intelligent workspace. AI-powered planning, real-time collaboration, and automations that just work — so your team can focus on building, not tracking.',
    cta_primary: 'Start for free',
    cta_secondary: 'See how it works',
    social_proof: 'Trusted by 4,200+ product teams · No credit card required',
    badge: 'AI-powered · SOC 2 certified'
  },
  trust_bar: {
    label: 'Trusted by teams at',
    logos: ['Vercel', 'Stripe', 'Linear', 'Notion', 'Figma', 'Loom', 'Resend', 'Railway']
  },
  features: {
    eyebrow: 'Everything your team needs',
    heading: 'Built for speed.\nDesigned for clarity.',
    subheading:
      'Every feature is designed to reduce friction and keep your team in flow — not fighting with software.',
    items: [
      {
        icon: '⚡',
        title: 'AI-powered planning',
        description:
          'Describe your project in plain English. Streamline generates milestones, tasks, and timelines automatically — updated as your scope evolves.',
        badge: 'AI'
      },
      {
        icon: '🔗',
        title: 'Real-time collaboration',
        description:
          'Every cursor, every comment, every status update — synced instantly across your entire team with zero lag and zero conflicts.'
      },
      {
        icon: '⚙️',
        title: 'Workflow automation',
        description:
          'Build powerful no-code automations in minutes. Trigger actions across tools when tasks move, deadlines approach, or PRs merge.'
      },
      {
        icon: '📊',
        title: 'Smart analytics',
        description:
          'Velocity charts, cycle time tracking, and burndown reports that actually help — not just dashboards that look good in demos.'
      },
      {
        icon: '🔒',
        title: 'Enterprise-grade security',
        description:
          'SOC 2 Type II certified, GDPR compliant, SSO with every major provider, and granular role-based access control built in.'
      },
      {
        icon: '🧩',
        title: '80+ integrations',
        description:
          'GitHub, Slack, Figma, Notion, Linear, Jira and 75 more. Streamline lives where your team already works.'
      }
    ]
  },
  how_it_works: {
    eyebrow: 'Get started in minutes',
    heading: 'From chaos to clarity\nin three steps.',
    subheading: 'No consultants, no implementation fees, no six-week onboarding. Just results.',
    steps: [
      {
        step: '01',
        title: 'Connect your stack',
        description:
          'Link your GitHub, Slack, and existing tools in under two minutes. Streamline pulls in your context automatically.',
        icon: '🔌'
      },
      {
        step: '02',
        title: 'Let AI plan your project',
        description:
          'Describe your goal. Our AI breaks it into sprints, assigns ownership, and flags risks before they become blockers.',
        icon: '🤖'
      },
      {
        step: '03',
        title: 'Ship and iterate fast',
        description:
          'Real-time updates, async standups, and automated reports keep your team aligned — even across time zones.',
        icon: '🚀'
      }
    ]
  },
  pricing: {
    eyebrow: 'Simple, honest pricing',
    heading: 'Start free.\nScale when you\'re ready.',
    subheading: 'No hidden fees. No per-seat surprises. Cancel any time.',
    tiers: [
      {
        name: 'Starter',
        price: '$0',
        period: 'forever',
        description: 'Perfect for small teams getting started.',
        cta: 'Get started free',
        highlighted: false,
        features: [
          'Up to 5 team members',
          '3 active projects',
          'Basic task management',
          'Slack integration',
          '7-day activity history',
          'Community support'
        ]
      },
      {
        name: 'Pro',
        price: '$49',
        period: 'per month',
        description: 'For growing teams that need more power.',
        cta: 'Start 14-day trial',
        highlighted: true,
        features: [
          'Unlimited team members',
          'Unlimited projects',
          'AI-powered planning',
          '80+ integrations',
          'Workflow automation',
          'Advanced analytics',
          'Priority support',
          'Custom fields & views'
        ]
      },
      {
        name: 'Enterprise',
        price: 'Custom',
        period: 'per year',
        description: 'For organisations with compliance needs.',
        cta: 'Talk to sales',
        highlighted: false,
        features: [
          'Everything in Pro',
          'SOC 2 & GDPR compliance',
          'SSO / SAML',
          'Custom data retention',
          'Dedicated success manager',
          'SLA guarantee',
          'On-premise option',
          'Audit logs'
        ]
      }
    ]
  },
  integrations: {
    heading: 'Works with the tools\nyour team already loves.',
    subheading: 'Connect in one click — no API keys, no maintenance.',
    items: [
      { name: 'GitHub', icon: '⚙️', category: 'Dev' },
      { name: 'Slack', icon: '💬', category: 'Comms' },
      { name: 'Figma', icon: '🎨', category: 'Design' },
      { name: 'Notion', icon: '📝', category: 'Docs' },
      { name: 'Linear', icon: '◆', category: 'Issues' },
      { name: 'Jira', icon: '🔷', category: 'Issues' },
      { name: 'Vercel', icon: '▲', category: 'Deploy' },
      { name: 'Stripe', icon: '💳', category: 'Billing' },
      { name: 'Sentry', icon: '🛡️', category: 'Monitoring' },
      { name: 'Datadog', icon: '📈', category: 'Observability' },
      { name: 'Loom', icon: '🎥', category: 'Video' },
      { name: 'Zapier', icon: '⚡', category: 'Automation' }
    ]
  },
  testimonials: {
    eyebrow: 'Loved by product teams',
    heading: 'Real teams. Real results.',
    items: [
      {
        quote:
          'We replaced Jira, Notion, and a Slack bot with Streamline. Our sprint planning went from 3 hours to 20 minutes. I genuinely didn\'t think that was possible.',
        author: 'Sarah K.',
        role: 'VP of Engineering',
        company: 'Launchpad AI',
        rating: 5,
        avatar_letter: 'S'
      },
      {
        quote:
          'The AI planning feature is not a gimmick — it actually understands dependencies and flags blockers we would have missed. It\'s like having a senior PM on every project.',
        author: 'Marcus T.',
        role: 'Head of Product',
        company: 'Relay Finance',
        rating: 5,
        avatar_letter: 'M'
      },
      {
        quote:
          'Onboarding took 40 minutes. Within a week our team was shipping 30% faster. The automation builder alone saved us from hiring a dedicated ops person.',
        author: 'Priya N.',
        role: 'CTO',
        company: 'Stackr',
        rating: 5,
        avatar_letter: 'P'
      }
    ]
  },
  security: {
    heading: 'Enterprise security. Built in, not bolted on.',
    items: [
      'SOC 2 Type II certified',
      'GDPR & CCPA compliant',
      'SSO / SAML support',
      '99.99% uptime SLA',
      'End-to-end encryption',
      'Role-based access control'
    ]
  },
  cta: {
    eyebrow: 'Ready to ship faster?',
    heading: 'Your team deserves\nbetter tools.',
    subheading:
      'Join 4,200+ teams who replaced their chaotic stack with Streamline. Set up in minutes, not months.',
    cta_primary: 'Start free — no card needed',
    cta_secondary: 'Book a demo',
    note: '14-day Pro trial included · Cancel any time · SOC 2 certified'
  },
  faq: {
    heading: 'Questions, answered.',
    items: [
      {
        q: 'How long does it take to set up?',
        a: 'Most teams are fully set up in under 40 minutes. Connect your tools, invite your team, and Streamline pulls in your existing context automatically.'
      },
      {
        q: 'Can I migrate from Jira or Notion?',
        a: 'Yes. We have one-click importers for Jira, Notion, Linear, Asana, and Trello. Your history, attachments, and structure come with you.'
      },
      {
        q: 'Is the AI planning actually useful?',
        a: 'It is not a chatbot bolted on. The AI reads your codebase, integrations, and past project data to give context-aware recommendations — not generic suggestions.'
      },
      {
        q: 'What happens when the trial ends?',
        a: 'You automatically drop to the Starter (free) plan. Your data is never deleted. Upgrade any time to restore Pro features without losing anything.'
      },
      {
        q: 'Do you offer discounts for startups or nonprofits?',
        a: 'Yes. Startups under Series A and registered nonprofits get 50% off Pro plans. Email us at hello@streamline.app to apply.'
      },
      {
        q: 'Is my data secure?',
        a: 'Streamline is SOC 2 Type II certified, GDPR compliant, and your data is encrypted at rest and in transit. We never sell or share customer data.'
      }
    ]
  },
  footer: {
    tagline: 'Built for teams who ship.',
    legal: '© 2025 Streamline, Inc. All rights reserved.',
    email: 'hello@streamline.app'
  },
  seo: {
    title: 'Streamline — AI-Powered Project Management for Fast Teams',
    description:
      'Replace your chaotic stack with one intelligent workspace. AI planning, real-time collaboration, and 80+ integrations. Start free.'
  }
}
