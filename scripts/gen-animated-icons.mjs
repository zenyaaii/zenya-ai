/**
 * Generates components/icons/animated/data.generated.ts — a map of
 * canonical-icon-name -> inner SVG markup, with `zi-*` animation classes baked
 * onto the animating element(s). The CSS in app/globals.css drives the motion
 * on hover (self-hover or ancestor `.group` hover).
 *
 * Run: node scripts/gen-animated-icons.mjs
 */
import { pathToFileURL } from 'url'
import { resolve } from 'path'
import { writeFileSync } from 'fs'

const ICO = resolve('node_modules/lucide-react/dist/esm/icons')

/** serialize one lucide iconNode into svg child markup (drop `key`). */
function serialize(node) {
  return node
    .map(([tag, attrs]) => {
      const a = Object.entries(attrs)
        .filter(([k]) => k !== 'key')
        .map(([k, v]) => `${k}="${v}"`)
        .join(' ')
      return `<${tag} ${a}/>`
    })
    .join('')
}

async function inner(kebab) {
  const mod = await import(pathToFileURL(resolve(ICO, kebab + '.mjs')).href)
  return serialize(mod.__iconNode)
}

/* ── hero icons: hand-choreographed, classes on specific parts ──────── */
const HEROES = {
  cart: `<g class="zi-nudge"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></g>`,
  'shopping-bag': `<g class="zi-swing" style="transform-origin:12px 3px"><path d="M16 10a4 4 0 0 1-8 0"/><path d="M3.103 6.034h17.794"/><path d="M3.4 5.467a2 2 0 0 0-.4 1.2V20a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6.667a2 2 0 0 0-.4-1.2l-2-2.667A2 2 0 0 0 17 2H7a2 2 0 0 0-1.6.8z"/></g>`,
  notify: `<g class="zi-swing" style="transform-origin:12px 4px"><path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326"/></g><path d="M10.268 21a2 2 0 0 0 3.464 0"/>`,
  heart: `<path class="zi-beat" style="transform-origin:12px 12px" d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5"/>`,
  star: `<path class="zi-popspin" style="transform-origin:12px 12px" d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"/>`,
  settings: `<g class="zi-spin" style="transform-origin:12px 12px"><path d="M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915"/><circle cx="12" cy="12" r="3"/></g>`,
  mail: `<rect x="2" y="4" width="20" height="16" rx="2"/><path class="zi-draw" pathLength="1" d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7"/>`,
  next: `<g class="zi-slide"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></g>`,
  check: `<path class="zi-draw" pathLength="1" d="M20 6 9 17l-5-5"/>`,
  shipping: `<g class="zi-nudge"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></g>`,
  gift: `<path d="M20 11v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8"/><path d="M12 7v14"/><rect x="3" y="7" width="18" height="4" rx="1"/><path class="zi-lift" style="transform-origin:12px 4px" d="M7.5 7a1 1 0 0 1 0-5A4.8 8 0 0 1 12 7a4.8 8 0 0 1 4.5-5 1 1 0 0 1 0 5"/>`,
  secure: `<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path class="zi-draw" pathLength="1" d="m9 12 2 2 4-4"/>`,
  rocket: `<g class="zi-fly"><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09"/><path d="M9 12a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.4 22.4 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 .05 5 .05"/></g>`,
  sparkles: `<path class="zi-twinkle" style="transform-origin:11px 12px" d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z"/><g class="zi-twinkle2" style="transform-origin:20px 4px"><path d="M20 2v4"/><path d="M22 4h-4"/></g><circle class="zi-twinkle3" style="transform-origin:4px 20px" cx="4" cy="20" r="2"/>`,
  coffee: `<g class="zi-tilt" style="transform-origin:12px 21px"><path d="M10 2v2"/><path d="M14 2v2"/><path d="M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1h14a4 4 0 1 1 0 8h-1"/><path d="M6 2v2"/></g>`,
  leaf: `<g class="zi-sway" style="transform-origin:4px 21px"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></g>`,
  search: `<g class="zi-wiggle"><path d="m21 21-4.34-4.34"/><circle cx="11" cy="11" r="8"/></g>`,
  send: `<g class="zi-fly"><path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"/><path d="m21.854 2.147-10.94 10.939"/></g>`,
  phone: `<g class="zi-shake" style="transform-origin:12px 12px"><path d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384"/></g>`,
  calendar: `<rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/><path class="zi-bob" d="M8 2v4"/><path class="zi-bob2" d="M16 2v4"/>`,
  user: `<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle class="zi-bob" cx="12" cy="7" r="4"/>`,
}

/* ── whole-glyph icons: [canonicalName, lucideKebab, anim, origin?] ──── */
const GLYPH = [
  // food & drink
  ['pizza','pizza','wobble'],['dining','utensils-crossed','pop'],['chef','chef-hat','bob'],
  ['cake','cake','bob'],['wine','wine','tilt','12 21'],['beer','beer','tilt','12 21'],
  ['soda','cup-soda','tilt','12 21'],['croissant','croissant','wobble'],['cookie','cookie','pop'],
  ['donut','donut','spin'],['ice-cream','ice-cream-cone','tilt','12 21'],['salad','salad','wobble'],
  ['soup','soup','bob'],['fish','fish','wiggle'],['chicken','drumstick','wobble'],['egg','egg','pop'],
  ['bread','wheat','sway','12 22'],['grill','flame','flicker'],['cooking','cooking-pot','bob'],
  ['popcorn','popcorn','jump'],['milk','milk','tilt','12 21'],['meat','beef','wobble'],
  // retail
  ['store','store','bob'],['tag','tag','swing','19 5'],['package','package','pop'],
  ['boxes','boxes','pop'],['basket','shopping-basket','swing','12 3'],['discount','percent','spin'],
  ['sale','badge-percent','pop'],['ticket','ticket','wobble'],['receipt','receipt','wave'],
  ['apparel','shirt','sway','12 3'],['gem','gem','pop'],['watch','watch','pop'],
  ['glasses','glasses','pop'],['shoes','footprints','bob'],['premium','crown','jump'],
  ['luxury','diamond','pop'],['bookmark','bookmark','swing','12 3'],['flag','flag','wave'],
  // shipping & travel
  ['flight','plane','fly'],['boat','ship','sway','12 20'],['bike','bike','nudge'],
  ['car','car','nudge'],['bus','bus','nudge'],['train','train-front','nudge'],['map','map','pop'],
  ['directions','navigation','wiggle'],['compass','compass','spin'],['worldwide','globe','spin'],
  ['anchor','anchor','sway','12 5'],['camping','tent','pop'],
  // money
  ['card','credit-card','wobble'],['wallet','wallet','pop'],['cash','banknote','pop'],
  ['coins','coins','jump'],['price','dollar-sign','pop'],['euro','euro','pop'],
  ['savings','piggy-bank','jump'],['bank','landmark','bob'],['payment','hand-coins','jump'],
  // trust & benefits
  ['verified','badge-check','pop'],['award','award','swing','12 4'],['trophy','trophy','jump'],
  ['medal','medal','swing','12 4'],['thumbs-up','thumbs-up','jump'],['lock','lock','shake','12 12'],
  ['privacy','fingerprint-pattern','pop'],['bolt','zap','flash'],['target','target','pop'],
  ['performance','gauge','pop'],['timer','timer','pop'],['clock','clock','pop'],
  ['hourglass','hourglass','flip'],['handshake','handshake','pop'],['partnership','heart-handshake','beat','12 12'],
  ['guarantee','badge-check','pop'],
  // nature & eco
  ['sun','sun','spin'],['moon','moon','tilt'],['water','droplet','bob'],['recycle','recycle','spin'],
  ['sprout','sprout','sway','12 22'],['pine','tree-pine','sway','12 22'],['trees','trees','sway','12 22'],
  ['flower','flower','spin'],['blossom','flower-2','spin'],['snow','snowflake','spin'],
  ['wind','wind','wiggle'],['mountain','mountain','pop'],
  ['cloud','cloud','nudge'],['feather','feather','sway','6 20'],['pets','paw-print','jump'],
  // wellness
  ['haircut','scissors','pop'],['brush','brush','wiggle'],['design','palette','wiggle'],
  ['spa','bath','bob'],['gym','dumbbell','pop'],['health','activity','pulse'],
  ['clinic','stethoscope','pop'],['medicine','pill','spin'],['medical','cross','pop'],
  ['dental','smile','pop'],['vision','eye','pop'],['mind','brain','pop'],
  ['accessibility','accessibility','pop'],['baby','baby','bob'],['care','hand-heart','beat','12 12'],
  // home & trades
  ['home','house','pop'],['building','building-2','pop'],['repair','wrench','swing','5 19'],
  ['tools','hammer','swing','5 19'],['painting','paint-roller','wiggle'],['drill','drill','wiggle'],
  ['measure','ruler','pop'],['construction','hard-hat','pop'],['electric','plug','pop'],
  ['idea','lightbulb','flash'],['cooling','fan','spin'],['heating','thermometer','pop'],
  ['cleaning','trash-2','pop'],['sanitize','spray-can','wiggle'],['pest','bug','wiggle'],
  ['key','key','wiggle'],['door','door-open','pop'],['furniture','sofa','pop'],['bedroom','bed-double','pop'],
  // tech & creative
  ['laptop','laptop','pop'],['mobile','smartphone','wiggle'],['desktop','monitor','pop'],
  ['wifi','wifi','pulse'],['code','code','pop'],['chip','cpu','pop'],['camera','camera','pop'],
  ['video','video','pop'],['film','film','pop'],['photo','image','pop'],['gallery','images','pop'],
  ['music','music','bob'],['podcast','mic','pop'],['audio','headphones','pop'],['writing','pen','wiggle'],
  ['book','book','pop'],['reading','book-open','pop'],['education','graduation-cap','jump'],
  ['puzzle','puzzle','pop'],['layers','layers','pop'],['magic','wand-sparkles','wiggle'],
  ['wand','wand-sparkles','wiggle'],['lens','aperture','spin'],
  // contact & ui
  ['chat','message-circle','pop'],['message','message-square','pop'],['mention','at-sign','spin'],
  ['community','users','pop'],['link','link','pop'],['share','share-2','pop'],['info','info','pop'],
  ['help','circle-question-mark','pop'],['quote','quote','pop'],['business','briefcase','swing','12 7'],
  ['document','file-text','pop'],['checklist','clipboard-list','pop'],['schedule','calendar-clock','pop'],
  // data & saas
  ['analytics','chart-column','pop'],['chart','chart-line','pop'],['growth','trending-up','pop'],
  ['integration','cable','pop'],['api','braces','pop'],['bot','bot','bob'],
  ['automation','workflow','spin'],['server','server','pop'],['database','database','pop'],
  ['battery','battery-charging','pulse'],['metrics','chart-pie','spin'],['webhook','webhook','pop'],
  ['network','network','pop'],['gear','cog','spin'],['connect','plug-2','pop'],
  ['returns','rotate-ccw','spin'],['refresh','refresh-cw','spin'],
]

const out = {}
// heroes first
for (const [name, html] of Object.entries(HEROES)) out[name] = html
// whole-glyph
for (const [name, kebab, anim, origin] of GLYPH) {
  if (out[name]) continue // hero wins
  let body
  try {
    body = await inner(kebab)
  } catch (e) {
    console.error('MISSING lucide icon:', kebab, '->', name)
    continue
  }
  const style = origin ? ` style="transform-origin:${origin.split(' ')[0]}px ${origin.split(' ')[1]}px"` : ''
  out[name] = `<g class="zi-${anim}"${style}>${body}</g>`
}

const header = `// AUTO-GENERATED by scripts/gen-animated-icons.mjs — do not edit by hand.
// Map: canonical icon name -> inner SVG markup with zi-* animation classes.
// Motion is driven by CSS in app/globals.css (hover / .group hover).
/* eslint-disable */
export const ANIMATED_SVG: Record<string, string> = ${JSON.stringify(out, null, 0)}
`
const dest = resolve('components/icons/animated/data.generated.ts')
writeFileSync(dest, header)
console.log('wrote', dest, 'with', Object.keys(out).length, 'icons')
