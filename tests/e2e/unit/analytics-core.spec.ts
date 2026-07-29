import { test, expect } from '@playwright/test'
import {
  isBotUA, deviceFromUA, browserFromUA, osFromUA,
  referrerHost, classifyChannel, classifyLink, normalizePath, pathFromLegacySlug,
  countryFlag, countryNameAr, deltaPct, resolveRange, formatDuration, isEventType,
} from '../../../lib/analytics-core'

// Pure logic behind every recorded row and every dashboard number. These are
// the functions a bad edit would silently corrupt — a broken bot regex would
// re-inflate the owner's traffic with crawlers, exactly the bug this feature
// set out to kill.

const UA = {
  chromeWin: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
  safariIphone: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  safariMac: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
  androidChrome: 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Mobile Safari/537.36',
  ipad: 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/604.1',
  edge: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36 Edg/120.0',
  googlebot: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
  googlebotMobile: 'Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/W.X.Y.Z Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
  curl: 'curl/8.12.1',
  siteVerify: 'Mozilla/5.0 (compatible; Google-Site-Verification/1.0)',
  fbExternal: 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
}

test.describe('bot classification', () => {
  test('flags every known crawler / tool', () => {
    for (const ua of [UA.googlebot, UA.googlebotMobile, UA.curl, UA.siteVerify, UA.fbExternal]) {
      expect(isBotUA(ua), ua).toBe(true)
    }
  })
  test('a missing UA is treated as a bot', () => {
    expect(isBotUA(null)).toBe(true)
    expect(isBotUA('')).toBe(true)
  })
  test('does not flag real browsers', () => {
    for (const ua of [UA.chromeWin, UA.safariIphone, UA.safariMac, UA.androidChrome, UA.ipad, UA.edge]) {
      expect(isBotUA(ua), ua).toBe(false)
    }
  })
  test('the mobile Googlebot (normal-looking mobile UA) is still caught', () => {
    // This is the trap: it carries a plausible Android Chrome UA. If device
    // classification ran first, it would count as a mobile customer.
    expect(deviceFromUA(UA.googlebotMobile)).toBe('Mobile')
    expect(isBotUA(UA.googlebotMobile)).toBe(true)
  })
})

test.describe('device / browser / os', () => {
  test('device', () => {
    expect(deviceFromUA(UA.chromeWin)).toBe('Desktop')
    expect(deviceFromUA(UA.safariIphone)).toBe('Mobile')
    expect(deviceFromUA(UA.androidChrome)).toBe('Mobile')
    expect(deviceFromUA(UA.ipad)).toBe('Tablet')
    expect(deviceFromUA(null)).toBe('Unknown')
  })
  test('browser precedence (Edge before Chrome before Safari)', () => {
    expect(browserFromUA(UA.edge)).toBe('Edge')
    expect(browserFromUA(UA.chromeWin)).toBe('Chrome')
    expect(browserFromUA(UA.safariMac)).toBe('Safari')
    expect(browserFromUA(UA.safariIphone)).toBe('Safari')
  })
  test('os', () => {
    expect(osFromUA(UA.chromeWin)).toBe('Windows')
    expect(osFromUA(UA.safariIphone)).toBe('iOS')
    expect(osFromUA(UA.safariMac)).toBe('macOS')
    expect(osFromUA(UA.androidChrome)).toBe('Android')
  })
})

test.describe('referrer + channel', () => {
  test('referrer host strips www and lowercases', () => {
    expect(referrerHost('https://www.Google.com/search?q=x')).toBe('google.com')
    expect(referrerHost('https://l.instagram.com/')).toBe('l.instagram.com')
    expect(referrerHost(null)).toBe(null)
    expect(referrerHost('not a url')).toBe(null)
  })
  test('no referrer, no utm = direct', () => {
    expect(classifyChannel({})).toBe('direct')
  })
  test('search / social / referral from host', () => {
    expect(classifyChannel({ referrerHost: 'google.com' })).toBe('search')
    expect(classifyChannel({ referrerHost: 'l.instagram.com' })).toBe('social')
    expect(classifyChannel({ referrerHost: 't.co' })).toBe('social')
    expect(classifyChannel({ referrerHost: 'somerandomblog.com' })).toBe('referral')
  })
  test('utm medium wins over inferred host', () => {
    expect(classifyChannel({ referrerHost: 'google.com', utmMedium: 'cpc' })).toBe('campaign')
    expect(classifyChannel({ referrerHost: 'google.com', utmMedium: 'email' })).toBe('email')
  })
  test('a utm source with no referrer is a campaign', () => {
    expect(classifyChannel({ utmSource: 'newsletter' })).toBe('campaign')
  })
  test('a click within the site itself is not a referral', () => {
    expect(classifyChannel({ referrerHost: 'zina.zenyaai.co', selfHost: 'zina.zenyaai.co' })).toBe('direct')
  })
})

test.describe('link classification (drives conversions with zero template edits)', () => {
  test('whatsapp in all its shapes', () => {
    expect(classifyLink('https://wa.me/9665xxxxxxx')).toBe('whatsapp_click')
    expect(classifyLink('https://api.whatsapp.com/send?phone=9665')).toBe('whatsapp_click')
  })
  test('phone / sms / email', () => {
    expect(classifyLink('tel:+96611234567')).toBe('phone_click')
    expect(classifyLink('sms:+96611234567')).toBe('phone_click')
    expect(classifyLink('mailto:hi@example.com')).toBe('email_click')
  })
  test('maps / booking / order / social', () => {
    expect(classifyLink('https://maps.app.goo.gl/abc')).toBe('map_click')
    expect(classifyLink('https://calendly.com/shop/30min')).toBe('booking_click')
    expect(classifyLink('https://talabat.com/store/x')).toBe('order_click')
    expect(classifyLink('https://instagram.com/shop')).toBe('social_click')
  })
  test('a plain external link is outbound; internal / empty is nothing', () => {
    expect(classifyLink('https://some-partner.com')).toBe('outbound_click')
    expect(classifyLink('/menu')).toBe(null)
    expect(classifyLink('#section')).toBe(null)
    expect(classifyLink(null)).toBe(null)
  })
})

test.describe('path normalization (the double-count root cause)', () => {
  test('strips query, hash, trailing slash', () => {
    expect(normalizePath('/menu/?utm=x#top')).toBe('/menu')
    expect(normalizePath('menu')).toBe('/menu')
    expect(normalizePath('/')).toBe('/')
    expect(normalizePath('')).toBe('/')
    expect(normalizePath(null)).toBe('/')
  })
  test('legacy "site/menu" slug becomes "/menu"', () => {
    expect(pathFromLegacySlug('wagar/menu')).toBe('/menu')
    expect(pathFromLegacySlug('wagar')).toBe('/')
    expect(pathFromLegacySlug(null)).toBe('/')
  })
})

test.describe('countries', () => {
  test('flag emoji from ISO code', () => {
    expect(countryFlag('SA')).toBe('🇸🇦')
    expect(countryFlag('sa')).toBe('🇸🇦')
    expect(countryFlag(null)).toBe('🏳️')
    expect(countryFlag('XX')).toBe('🇽🇽') // still two indicators, never a crash
  })
  test('Arabic names, graceful fallback', () => {
    expect(countryNameAr('SA')).toBe('السعودية')
    expect(countryNameAr('AE')).toBe('الإمارات')
    expect(countryNameAr('ZZ')).toBe('ZZ')       // unknown → raw code, not invented
    expect(countryNameAr(null)).toBe('غير معروف')
    expect(countryNameAr('unknown')).toBe('غير معروف')
  })
})

test.describe('ranges + deltas', () => {
  const now = new Date('2026-07-30T12:00:00Z')
  test('30d resolves to a 30-day window with an equal preceding window', () => {
    const r = resolveRange('30d', now)
    expect(r.days).toBe(30)
    expect(r.to.getTime()).toBe(now.getTime())
    expect(Math.round((r.to.getTime() - r.from.getTime()) / 86400000)).toBe(30)
    // previous period is the 30 days immediately before
    expect(r.prevTo.getTime()).toBe(r.from.getTime())
    expect(Math.round((r.prevTo.getTime() - r.prevFrom.getTime()) / 86400000)).toBe(30)
  })
  test('24h and 7d', () => {
    expect(resolveRange('24h', now).days).toBe(1)
    expect(resolveRange('7d', now).days).toBe(7)
  })
  test('a bad custom range falls back to 30d instead of NaN', () => {
    const r = resolveRange('custom', now, { from: 'not-a-date' })
    expect(r.from instanceof Date).toBe(true)
    expect(isNaN(r.from.getTime())).toBe(false)
  })
  test('delta is null (not Infinity) with no baseline', () => {
    expect(deltaPct(10, 0)).toBe(null)
    expect(deltaPct(0, 0)).toBe(0)
    expect(deltaPct(150, 100)).toBe(50)
    expect(deltaPct(50, 100)).toBe(-50)
  })
})

test.describe('formatting', () => {
  test('duration', () => {
    expect(formatDuration(0)).toBe('0 ث')
    expect(formatDuration(5000)).toBe('5 ث')
    expect(formatDuration(90_000)).toBe('1 د 30 ث')
    expect(formatDuration(null)).toBe('0 ث')
  })
  test('event type guard', () => {
    expect(isEventType('whatsapp_click')).toBe(true)
    expect(isEventType('nope')).toBe(false)
    expect(isEventType(123)).toBe(false)
  })
})
