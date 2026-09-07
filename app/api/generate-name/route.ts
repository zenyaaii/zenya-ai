import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { logAiUsage, getUserIdSafe } from '@/lib/ai-usage';

/**
 * Constructed on first request, not at module scope.
 *
 * `new OpenAI()` throws when OPENAI_API_KEY is unset, and at module scope that
 * throw happens while Next is COLLECTING PAGE DATA — so a deployment with no
 * OpenAI key set fails the whole build on this one route, rather than failing
 * this one route when somebody calls it. Measured on Vercel: "Failed to collect
 * page data for /api/generate-name".
 *
 * Deferring it changes nothing where the key is configured; where it is not,
 * the build succeeds and only this endpoint errors, which is the correct blast
 * radius.
 */
let openaiClient: OpenAI | null = null;
function getOpenAI(): OpenAI {
  return (openaiClient ??= new OpenAI({ apiKey: process.env.OPENAI_API_KEY }));
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({} as any));
    const context = typeof body?.context === 'string' ? body.context.slice(0, 2000) : '';
    if (!context) {
      return NextResponse.json({ error: 'invalid_input', message: 'context (string) required' }, { status: 400 });
    }

    const completion = await getOpenAI().chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an expert Arabic e-commerce copywriter for an Arabic brand. Generate a premium, catchy product/brand name IN ARABIC based on the context provided. The name MUST be 1 to 2 words maximum, written in Arabic script only. Return ONLY the name, no quotes, no Latin letters, no extra text, no periods."
        },
        {
          role: "user",
          content: `Product context: ${context}`
        }
      ],
      temperature: 0.7,
      max_tokens: 24,
    });

    await logAiUsage({ operation: 'generate-name', userId: await getUserIdSafe(), model: 'gpt-4o-mini' }, completion.usage);

    let generatedName = completion.choices[0]?.message?.content?.trim() || "منتج مميز";
    generatedName = generatedName.replace(/^["']|["']$/g, ''); // strip quotes if any

    return NextResponse.json({ name: generatedName });
  } catch (error) {
    console.error('Error generating name:', error);
    return NextResponse.json({ name: "منتج مميز" }, { status: 500 });
  }
}