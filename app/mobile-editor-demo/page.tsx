'use client'

/**
 * DEV-ONLY visual harness for the phone editor.
 *
 * Mounts the real <MobileEditor> with mock content + a mock Preview so the
 * draggable sheet, tap-to-edit, section picker, colors + typography panels can
 * be exercised on a phone viewport without a logged-in session or a real theme.
 *
 * Safe to delete — nothing in the app links to /mobile-editor-demo.
 */

import { useState } from 'react'
import MobileEditor from '@/components/editor/MobileEditor'
import type { PreviewProps } from '@/components/editor/ThemeEditor'
import type { Status } from '@/components/editor/panels'
import { setPath } from '@/utils/theme-editor-types'
import type {
  EditorConfig, SectionStyle, SectionStyles,
} from '@/utils/theme-editor-types'
import { Home, Sparkles, MessageSquareQuote, Phone } from 'lucide-react'

/* ── Mock content ────────────────────────────────────────────────────── */
const INITIAL_CONTENT = {
  brand: { name: 'مقهى الأصيل', tagline: 'قهوة مختصّة في قلب المدينة' },
  hero: {
    headline: 'قهوة تُروى لها الحكايات',
    subheadline: 'حبوب مُحمّصة يوميًا، تُقدّم بحبٍّ من الصباح حتى المساء.',
  },
  features: {
    heading: 'لماذا نحن',
    items: [
      { title: 'تحميص طازج', description: 'نُحمّص حبوبنا كل صباح.' },
      { title: 'أجواء دافئة', description: 'مكان يجمع الأصدقاء.' },
    ],
  },
  testimonial: { quote: 'أفضل فنجان قهوة جرّبته في حياتي.', author: 'سارة م.' },
  contact: { heading: 'زورونا', address: 'شارع الملك فهد، الرياض', phone: '+966 55 555 5555' },
}

/* ── Mock editor config ──────────────────────────────────────────────── */
const CONFIG: EditorConfig = {
  contentKey: 'demo',
  themeName: 'مقهى الأصيل',
  brandNamePath: 'brand.name',
  defaultPresetId: 'warm',
  pages: [{ id: 'home', label: 'الرئيسية', icon: Home }],
  panels: [
    {
      id: 'hero', label: 'الواجهة', icon: Sparkles, page: 'home',
      fields: [
        { type: 'text', path: 'hero.headline', label: 'العنوان' },
        { type: 'textarea', path: 'hero.subheadline', label: 'الوصف', rows: 3 },
      ],
    },
    {
      id: 'features', label: 'المميزات', icon: Sparkles, page: 'home',
      fields: [
        { type: 'text', path: 'features.heading', label: 'عنوان القسم' },
        {
          type: 'array', path: 'features.items', label: 'العناصر', itemLabel: 'ميزة',
          itemTitle: 'title',
          itemFields: [
            { type: 'text', path: 'title', label: 'العنوان' },
            { type: 'textarea', path: 'description', label: 'الوصف', rows: 2 },
          ],
          makeItem: () => ({ title: 'ميزة جديدة', description: '' }),
        },
      ],
    },
    {
      id: 'testimonial', label: 'رأي العملاء', icon: MessageSquareQuote, page: 'home',
      fields: [
        { type: 'textarea', path: 'testimonial.quote', label: 'الاقتباس', rows: 3 },
        { type: 'text', path: 'testimonial.author', label: 'الكاتب' },
      ],
    },
    {
      id: 'contact', label: 'تواصل', icon: Phone, page: 'home',
      fields: [
        { type: 'text', path: 'contact.heading', label: 'العنوان' },
        { type: 'text', path: 'contact.address', label: 'العنوان البريدي' },
        { type: 'text', path: 'contact.phone', label: 'الهاتف' },
      ],
    },
  ],
  globalPanels: [
    {
      id: 'brand', label: 'الهوية', icon: Sparkles,
      fields: [
        { type: 'text', path: 'brand.name', label: 'اسم العلامة' },
        { type: 'text', path: 'brand.tagline', label: 'الشعار' },
      ],
    },
  ],
  colorPresets: [
    { id: 'warm', name: 'دافئ', vibe: 'ترحيبي', heading_font: 'Tajawal', colors: { primary: '#a1542f', accent: '#d98c5f', background: '#fdf7f0', surface: '#f4e9dc', text: '#2b1d13', border: '#e3d2bf' } },
    { id: 'noir', name: 'داكن', vibe: 'أنيق', heading_font: 'Tajawal', colors: { primary: '#1c1c1c', accent: '#c8a24a', background: '#0f0f0f', surface: '#1a1a1a', text: '#f5f0e6', border: '#2c2c2c' } },
  ],
  colorTokens: [
    { key: 'primary', label: 'اللون الأساسي' },
    { key: 'accent', label: 'اللون المميّز' },
    { key: 'background', label: 'الخلفية' },
    { key: 'text', label: 'النص' },
  ],
}

/* ── Mock Preview — renders sections tagged with data-section ─────────── */
function DemoPreview({ content, colorOverrides }: PreviewProps) {
  const c = content
  const base = CONFIG.colorPresets[0].colors
  const col = { ...base, ...(colorOverrides || {}) }
  const sec: React.CSSProperties = { padding: '48px 24px', borderBottom: `1px solid ${col.border}` }
  return (
    <div style={{ background: col.background, color: col.text, fontFamily: 'Tajawal, sans-serif', minHeight: '100%' }}>
      <div data-section="hero" style={{ ...sec, background: col.surface, textAlign: 'center', paddingTop: 72, paddingBottom: 72 }}>
        <div style={{ fontSize: 13, letterSpacing: '0.2em', color: col.accent, marginBottom: 12 }}>{c.brand?.tagline}</div>
        <h1 style={{ fontSize: 34, fontWeight: 800, lineHeight: 1.2, margin: 0 }}>{c.hero?.headline}</h1>
        <p style={{ fontSize: 16, opacity: 0.75, marginTop: 16 }}>{c.hero?.subheadline}</p>
        <button style={{ marginTop: 24, background: col.primary, color: '#fff', border: 0, borderRadius: 999, padding: '12px 28px', fontSize: 15, fontWeight: 700 }}>اطلب الآن</button>
      </div>

      <div data-section="features" style={sec}>
        <h2 style={{ fontSize: 24, fontWeight: 700, textAlign: 'center', marginTop: 0 }}>{c.features?.heading}</h2>
        <div style={{ display: 'grid', gap: 16, marginTop: 24 }}>
          {(c.features?.items || []).map((it: any, i: number) => (
            <div key={i} style={{ background: col.surface, borderRadius: 14, padding: 20 }}>
              <div style={{ fontSize: 18, fontWeight: 700 }}>{it.title}</div>
              <div style={{ fontSize: 14, opacity: 0.7, marginTop: 6 }}>{it.description}</div>
            </div>
          ))}
        </div>
      </div>

      <div data-section="testimonial" style={{ ...sec, textAlign: 'center', background: col.surface }}>
        <div style={{ fontSize: 40, color: col.accent, lineHeight: 1 }}>&ldquo;</div>
        <p style={{ fontSize: 20, fontWeight: 600, margin: '8px 0 16px' }}>{c.testimonial?.quote}</p>
        <div style={{ fontSize: 14, opacity: 0.7 }}>— {c.testimonial?.author}</div>
      </div>

      <div data-section="contact" style={{ ...sec, textAlign: 'center' }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, marginTop: 0 }}>{c.contact?.heading}</h2>
        <p style={{ fontSize: 15, opacity: 0.8, marginTop: 12 }}>{c.contact?.address}</p>
        <p style={{ fontSize: 15, fontWeight: 700, color: col.primary }}>{c.contact?.phone}</p>
      </div>
    </div>
  )
}

export default function MobileEditorDemoPage() {
  const [content, setContent] = useState<any>(INITIAL_CONTENT)
  const [presetId, setPresetId] = useState('warm')
  const [typographyPreset, setTypographyPreset] = useState('')
  const [colorOverrides, setColorOverrides] = useState<Record<string, string>>({})
  const [sectionStyles, setSectionStyles] = useState<SectionStyles>({})
  const [selected, setSelected] = useState('hero')
  const [view, setView] = useState('home')
  const [status, setStatus] = useState<Status>('idle')
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null)

  const setOverride = (k: string, v: string | undefined) =>
    setColorOverrides((cur) => {
      const next = { ...cur }
      if (v == null || v === '') delete next[k]; else next[k] = v
      return next
    })

  const patchSectionStyle = (id: string, patch: Partial<SectionStyle>) =>
    setSectionStyles((cur) => ({ ...cur, [id]: { ...(cur[id] || {}), ...patch } }))

  return (
    <MobileEditor
      themeName="مقهى الأصيل"
      backHref="/dashboard/sites"
      config={CONFIG}
      Preview={DemoPreview}
      content={content}
      presetId={presetId}
      colorOverrides={colorOverrides}
      typographyPreset={typographyPreset}
      sectionStyles={sectionStyles}
      selected={selected}
      setSelected={setSelected}
      view={view}
      setView={setView}
      status={status}
      dirty={true}
      lastSavedAt={lastSavedAt}
      now={Date.now()}
      save={() => { setStatus('saving'); setTimeout(() => { setStatus('saved'); setLastSavedAt(Date.now()); setTimeout(() => setStatus('idle'), 1400) }, 500) }}
      undo={() => {}}
      redo={() => {}}
      canUndo={false}
      canRedo={false}
      patchPath={(path, value) => setContent((c: any) => setPath(c, path, value))}
      setPresetId={setPresetId}
      setOverride={setOverride}
      resetOverrides={() => setColorOverrides({})}
      setTypographyPreset={setTypographyPreset}
      patchSectionStyle={patchSectionStyle}
      clearSectionStyle={(id) => setSectionStyles((cur) => { const n = { ...cur }; delete n[id]; return n })}
      error={null}
    />
  )
}
