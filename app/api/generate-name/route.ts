import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  try {
    const { context } = await req.json();

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an expert e-commerce copywriter. Generate a premium, catchy product name based on the context provided. The name MUST be 1 to 3 words maximum. Return ONLY the name, no quotes, no extra text, no periods."
        },
        {
          role: "user",
          content: `Product context: ${context}`
        }
      ],
      temperature: 0.7,
      max_tokens: 10,
    });

    let generatedName = completion.choices[0]?.message?.content?.trim() || "Premium Product";
    generatedName = generatedName.replace(/^["']|["']$/g, ''); // strip quotes if any

    return NextResponse.json({ name: generatedName });
  } catch (error) {
    console.error('Error generating name:', error);
    return NextResponse.json({ name: "Premium Product" }, { status: 500 });
  }
}