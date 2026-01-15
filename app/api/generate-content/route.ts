import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { generateContentSchema } from '@/utils/validators'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const parsed = generateContentSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'invalid' }, { status: 400 })
  const name = parsed.data.name
  const audience = parsed.data.audience || 'dropshippers and one-product store buyers'

  const getMockContent = (productName: string) => ({
    hero: {
      headline: `The Ultimate ${productName}`,
      subheadline: "Experience perfection in every detail with the most advanced design on the market.",
      cta: "Get 50% Off Today"
    },
    slideshow: [
      { heading: `Welcome to the Future of ${productName}`, subheading: "Discover the innovation that everyone is talking about.", cta: "Shop Collection" },
      { heading: "Engineered for Excellence", subheading: "Quality that stands the test of time.", cta: "Learn More" }
    ],
    video_hero: {
      heading: "Cinematic Excellence",
      subheading: "Immerse yourself in the story behind the brand.",
      cta: "Watch Film"
    },
    features: [
      { title: "Eco-Friendly Materials", desc: "Crafted with 100% sustainable materials that are built to last a lifetime.", icon: "leaf" },
      { title: "Ergonomic Design", desc: "Designed by experts to fit perfectly in your life, maximizing comfort and utility.", icon: "design" },
      { title: "Instant Setup", desc: "Ready to use right out of the box. No complicated manuals or tools required.", icon: "bolt" }
    ],
    problem: {
      headline: "Tired of cheap alternatives that break?",
      text: "Most products on the market are built with planned obsolescence in mind. They look good but fail when you need them most, leaving you frustrated and out of pocket."
    },
    solution: {
      headline: `Meet the ${productName}`,
      text: "We engineered this from the ground up to solve every pain point. Durable, stylish, and incredibly effective—it is the last one you will ever need to buy."
    },
    testimonials: [
      { name: "Sarah J.", text: "This changed my daily routine completely. Highly recommended!", location: "New York, USA", rating: 5 },
      { name: "Mike T.", text: "Best investment I've made this year. Quality is unmatched.", location: "London, UK", rating: 5 },
      { name: "Jessica L.", text: "Fast shipping and great customer service. 10/10.", location: "Sydney, AU", rating: 5 }
    ],
    faq: [
      { q: "Is this suitable for beginners?", a: "Absolutely! It is designed for all skill levels." },
      { q: "How do I clean it?", a: "Just wipe it down with a damp cloth after use." },
      { q: "What is the warranty?", a: "We offer a full 5-year comprehensive warranty." },
      { q: "Do you ship internationally?", a: "Yes, we ship to over 50 countries worldwide." }
    ],
    guarantee: {
      title: "Ironclad 30-Day Guarantee",
      text: "Try it risk-free. If you aren't completely blown away, simply return it for a full refund. No questions asked.",
      days: 30
    },
    rich_text: {
      title: "Our Mission",
      text: "We believe in creating products that actually solve problems, not just add clutter to your life."
    },
    image_text: {
      title: "Designed for Real Life",
      text: "We spent 2 years prototyping to ensure every curve and edge serves a purpose.",
      cta: "Read Our Story"
    },
    newsletter: {
      title: "Join the Inner Circle",
      text: "Get exclusive access to new drops and secret sales."
    },
    timeline: [
      { year: "2020", title: "The Idea", text: "It started with a sketch on a napkin." },
      { year: "2021", title: "Prototyping", text: "We tested 50+ iterations to get it right." },
      { year: "2023", title: "Launch", text: "We shared our creation with the world." }
    ],
    scrolling_text: [
      "Free Worldwide Shipping", "30-Day Money Back Guarantee", "Over 10,000 Happy Customers", "Rated 5 Stars"
    ],
    comparison: [
      { feature: "Premium Materials", us: true, them: false },
      { feature: "24/7 Support", us: true, them: false },
      { feature: "Lifetime Warranty", us: true, them: false },
      { feature: "Eco-Friendly", us: true, them: false }
    ],
    multicolumn: [
      { title: "Fast Shipping", text: "We ship within 24 hours of your order." },
      { title: "Secure Payment", text: "Your data is protected by 256-bit encryption." },
      { title: "Expert Support", text: "Our team is here to help you 24/7." }
    ]
  })
  
  if (!process.env.OPENAI_API_KEY) {
    // Mock response for development/no-key scenarios
    await new Promise(r => setTimeout(r, 2000))
    return NextResponse.json(getMockContent(name))
  }

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const resp = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { 
          role: 'system', 
          content: `You are a world-class direct response copywriter and market researcher for high-converting dropshipping stores.
          
          YOUR TASK:
          1. DEEP RESEARCH: Analyze the product name and context to infer the target audience, their deepest pain points, common objections, and the "dream outcome".
          2. COMPETITOR ANALYSIS: Assume what cheap competitors are doing wrong (e.g., "flimsy materials", "hard to use") and position this product as the superior "2.0" version.
          3. WRITE COPY: Generate persuasive, emotional, and benefit-driven copy for specific store sections.
          
          TONE RULES:
          - Do NOT sound like AI.
          - Use short, punchy sentences.
          - Use power words (e.g., "Instant", "Guaranteed", "Revolutionary").
          - Focus on "You" (the customer).
          
          OUTPUT FORMAT:
          Return strictly JSON with the following structure.` 
        },
        { 
          role: 'user', 
          content: `Product Name: ${name}
          Target Audience: ${audience}
          
          Generate content for these sections:
          
          1. HERO:
             - headline: 5-7 words. High impact. Promise a result.
             - subheadline: 2 sentences. Explain HOW it works and the immediate benefit.
             - cta: Short action (e.g., "Get 50% Off Now").
             
          2. SLIDESHOW (Array of 2):
             - heading: Brand-focused.
             - subheading: Aspirational.
             - cta: "Shop Now" variation.

          3. VIDEO_HERO:
             - heading: Short, cinematic title (e.g., "Experience the Difference").
             - subheading: Invite them to watch.
             - cta: "Watch Film" or similar.

          4. FEATURES (Array of 3):
             - title: Benefit-focused (not feature-focused).
             - desc: 1-2 sentences explaining why this matters.
             - icon: Suggest a lucide-react icon name (e.g., "shield", "zap", "star", "leaf", "clock").
             
          5. PROBLEM (The "Before" state):
             - headline: A question hooking their pain (e.g., "Struggling with X?").
             - text: Agitate the problem. Why do current solutions fail? Make them feel understood.
             
          6. SOLUTION (The "After" state):
             - headline: Introduce the product as the hero.
             - text: How does it solve the problem? Use words like "Engineered", "Designed", "Finally".
             
          7. TESTIMONIALS (Array of 3):
             - name: Realistic names.
             - text: Specific praise about solving a pain point. Mention "fast shipping" or "quality" in at least one.
             - location: City, Country.
             - rating: Always 5.
             
          8. FAQ (Array of 4):
             - q: Common objections (Price? Shipping? Quality? Usage?).
             - a: Reassuring, authoritative answers.
             
          9. GUARANTEE:
             - title: e.g., "30-Day Risk-Free Guarantee".
             - text: Remove all risk. "If you don't love it, we refund you."
             - days: 30

          10. RICH_TEXT:
              - title: "Our Story" or "Why We Started".
              - text: A short paragraph (2-3 sentences) about the brand mission.

          11. IMAGE_TEXT:
              - title: A specific use-case or lifestyle benefit.
              - text: Describe using the product in daily life.
              - cta: "Learn More".

          12. NEWSLETTER:
              - title: "Join the Club" style heading.
              - text: Incentive to subscribe (e.g., "Get 10% off your first order").

          13. TIMELINE (Array of 3):
              - year: 2021, 2022, 2024.
              - title: Key milestones (Idea, Launch, Growth).
              - text: Short description.

          14. SCROLLING_TEXT (Array of 4 strings):
              - Short benefits like "Free Shipping", "Lifetime Warranty", etc.

          15. COMPARISON (Array of 4):
              - feature: A key feature.
              - us: true
              - them: false

          16. MULTICOLUMN (Array of 3):
              - title: Additional benefit (e.g. "Fast Shipping").
              - text: 1 sentence detail.
          ` 
        }
      ],
      response_format: { type: 'json_object' }
    })
    
    const content = resp.choices[0]?.message?.content
    if (!content) throw new Error('No content from OpenAI')
    
    return NextResponse.json(JSON.parse(content))
  } catch (error: any) {
    console.error('OpenAI Error (Falling back to mock):', error)
    // Fallback to mock content instead of erroring
    return NextResponse.json(getMockContent(name))
  }
}
