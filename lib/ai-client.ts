import Anthropic from '@anthropic-ai/sdk'
import { anthropicOutage, noteDown, noteUp, OutageError } from '@/lib/service-health'

/**
 * The one door every AI call in the app goes through. Claude, behind the
 * small chat shape the generators were written against
 * (`client.chat.completions.create({ model, messages, max_tokens })` →
 * `{ choices: [{ message: { content }, finish_reason }], usage }`), so the
 * prompts and the code that reads the answers did not have to move.
 *
 * What the adapter does for the callers:
 *  - system messages become Claude's `system` field;
 *  - images given as data URLs become base64 image blocks; http(s) URLs pass by url;
 *  - `response_format: json_object` becomes an instruction to answer with one
 *    JSON object, and the answer is trimmed to that object (no fences, no prose);
 *  - sampling knobs (temperature, penalties, seed) are dropped: the current
 *    models choose their own sampling and reject non-default values;
 *  - usage is reported as prompt/completion/total tokens for lib/ai-usage.
 *
 * Needs ANTHROPIC_API_KEY on the server.
 */

export const aiKey = () => process.env.ANTHROPIC_API_KEY || process.env.anthropic_api_key || ''

export type ContentPart =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string; detail?: string } }

export type ChatMessage = {
  role: 'system' | 'user' | 'assistant'
  content: string | ContentPart[]
}

export type ChatParams = {
  model: string
  messages: ChatMessage[]
  max_tokens?: number
  response_format?: { type: 'json_object' | 'text' }
  /** Accepted for old call sites; ignored. */
  temperature?: number
  presence_penalty?: number
  frequency_penalty?: number
  seed?: number
}

export type ChatResult = {
  choices: { message: { content: string }; finish_reason: 'stop' | 'length' }[]
  usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number }
}

const JSON_RULE = 'Answer with exactly one valid JSON object and nothing else: no prose before or after it, no Markdown, no code fences.'

/** Cuts a JSON answer down to the object itself, in case a fence or a sentence slipped around it. */
function onlyJson(text: string): string {
  const t = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
  const a = t.indexOf('{'), b = t.lastIndexOf('}')
  return a >= 0 && b > a ? t.slice(a, b + 1) : t
}

function imageBlock(url: string): Anthropic.ImageBlockParam {
  const m = /^data:(image\/(?:jpeg|png|gif|webp));base64,(.+)$/s.exec(url)
  if (m) return { type: 'image', source: { type: 'base64', media_type: m[1] as 'image/jpeg', data: m[2] } }
  return { type: 'image', source: { type: 'url', url } }
}

function toBlocks(content: string | ContentPart[]): string | Anthropic.ContentBlockParam[] {
  if (typeof content === 'string') return content
  return content.map((p) => (p.type === 'text' ? { type: 'text' as const, text: p.text } : imageBlock(p.image_url.url)))
}

/** Which knobs each model accepts: the small model may switch thinking off; the main one thinks only between tool calls (none here). */
function modelOptions(model: string): Pick<Anthropic.MessageCreateParamsNonStreaming, 'thinking' | 'output_config'> {
  if (/haiku/i.test(model)) return { thinking: { type: 'disabled' }, output_config: { effort: 'medium' } }
  if (/sonnet-5-5/i.test(model)) return { thinking: { type: 'between_tools' }, output_config: { effort: 'medium' } }
  if (/opus/i.test(model)) return { thinking: { type: 'adaptive' }, output_config: { effort: 'medium' } }
  return {}
}

export class AiClient {
  private client: Anthropic
  constructor(opts: { apiKey?: string; timeout?: number } = {}) {
    this.client = new Anthropic({ apiKey: opts.apiKey || aiKey(), maxRetries: 2, ...(opts.timeout ? { timeout: opts.timeout } : {}) })
  }

  chat = {
    completions: {
      create: async (p: ChatParams, opts?: { timeout?: number; signal?: AbortSignal }): Promise<ChatResult> => {
        const json = p.response_format?.type === 'json_object'
        const system = p.messages.filter((m) => m.role === 'system')
          .map((m) => (typeof m.content === 'string' ? m.content : m.content.map((c) => (c.type === 'text' ? c.text : '')).join('\n')))
        if (json) system.push(JSON_RULE)
        const messages: Anthropic.MessageParam[] = p.messages
          .filter((m) => m.role !== 'system')
          .map((m) => ({ role: m.role as 'user' | 'assistant', content: toBlocks(m.content) }))
        let res: Anthropic.Message
        try {
          res = await this.client.messages.create({
            model: p.model,
            max_tokens: p.max_tokens ?? 4000,
            ...(system.length ? { system: system.join('\n\n') } : {}),
            messages,
            ...modelOptions(p.model),
          }, opts)
        } catch (e) {
          // No credit, a spend limit or a bad key: the admin dashboard says so, and the caller learns which.
          const o = anthropicOutage(e)
          if (o) { await noteDown(o); throw new OutageError(o) }
          throw e
        }
        void noteUp('anthropic')
        if (res.stop_reason === 'refusal') throw new Error('AI refused the request')
        let text = res.content.filter((b): b is Anthropic.TextBlock => b.type === 'text').map((b) => b.text).join('')
        if (json) text = onlyJson(text)
        const prompt = res.usage.input_tokens + (res.usage.cache_read_input_tokens ?? 0) + (res.usage.cache_creation_input_tokens ?? 0)
        const completion = res.usage.output_tokens
        return {
          choices: [{ message: { content: text }, finish_reason: res.stop_reason === 'max_tokens' ? 'length' : 'stop' }],
          usage: { prompt_tokens: prompt, completion_tokens: completion, total_tokens: prompt + completion },
        }
      },
    },
  }
}

