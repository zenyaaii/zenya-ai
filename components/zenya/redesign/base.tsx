/**
 * Shared parts of the five redesign samples.
 *
 * The samples are server components with no client bundle of their own: the
 * styles are strings in <style>, the motion is CSS, and one small inline
 * script (RUNTIME) does what CSS cannot (reveal on scroll, play a video only
 * while it is on screen, loop one part of a recording, theme switch, menu).
 * That keeps the sample identical whether it is opened from the dev server or
 * exported to a static page for review.
 */
import type { ReactNode } from 'react'
import ZenyaMark from '@/components/ZenyaMark'
import { Moon, Sun, Menu, X, Star, Check, Plus, ArrowUpLeft } from 'lucide-react'
import { AUTH, NAV, FOOTER } from './data'

export { Check, Plus, ArrowUpLeft }

export const FONTS_CSS = `
@font-face { font-family: "Thm Display"; font-weight: 400; src: local("thmanyah serif display Regular"), local("thmanyahserifdisplay-Regular"); }
@font-face { font-family: "Thm Display"; font-weight: 500; src: local("thmanyah serif display Medium"), local("thmanyahserifdisplay-Medium"); }
@font-face { font-family: "Thm Display"; font-weight: 600 800; src: local("thmanyah serif display Bold"), local("thmanyahserifdisplay-Bold"); }
@font-face { font-family: "Thm Display"; font-weight: 900; src: local("thmanyah serif display Black"), local("thmanyahserifdisplay-Black"); }
@font-face { font-family: "Thm Text"; font-weight: 300; src: local("thmanyah serif text Light"), local("thmanyahseriftext-Light"); }
@font-face { font-family: "Thm Text"; font-weight: 400; src: local("thmanyah serif text Regular"), local("thmanyahseriftext-Regular"); }
@font-face { font-family: "Thm Text"; font-weight: 500; src: local("thmanyah serif text Medium"), local("thmanyahseriftext-Medium"); }
@font-face { font-family: "Thm Text"; font-weight: 600 800; src: local("thmanyah serif text Bold"), local("thmanyahseriftext-Bold"); }
@font-face { font-family: "Thm Text"; font-weight: 900; src: local("thmanyah serif text Black"), local("thmanyahseriftext-Black"); }
`

/* The dashboard v6 palette (components/app/v6/v6.css), light and dark.
   Secondary text uses the dashboard's contrast-checked stone, not --mut. */
export const BASE_CSS = `
.rd{
  --bg:#F4EFE6;--bg2:#EFE9DE;--card:#FFFDF9;--card2:#F1EBE1;--card3:#E6DED0;
  --ink:#16120D;--ink2:#3B342C;--mut:#5F574D;--mut2:#8A8074;
  --line:rgba(22,18,13,.09);--line2:rgba(22,18,13,.16);
  --acc:#E2532A;--acc-ink:#B23A17;--acc-soft:rgba(226,83,42,.12);--ok:#2F8F5B;
  --inv:#16120D;--on-inv:#F4EFE6;--shadow:0 1px 2px rgba(22,18,13,.05),0 12px 32px -12px rgba(22,18,13,.16);
  --f-head:"Thm Display",var(--font-amiri),"Amiri",serif;
  --f-ui:"Thm Text",var(--font-markazi),"Markazi Text",serif;
  --out:cubic-bezier(.22,1,.36,1);
  --gut:16px;--max:1180px;
  color-scheme:light;
  background:var(--bg);color:var(--ink);font-family:var(--f-ui);font-size:18px;line-height:1.7;
  min-height:100vh;overflow-x:clip;-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility;
}
.rd[data-mode="dark"]{
  --bg:#0F0D0A;--bg2:#13110E;--card:#1A1713;--card2:#24201A;--card3:#2E2922;
  --ink:#F4EFE6;--ink2:#DAD1C4;--mut:#A39A8D;--mut2:#7E766B;
  --line:rgba(244,239,230,.08);--line2:rgba(244,239,230,.16);
  --acc:#E2532A;--acc-ink:#F07A52;--acc-soft:rgba(226,83,42,.2);--ok:#4CB37A;
  --inv:#F4EFE6;--on-inv:#16120D;--shadow:0 1px 2px rgba(0,0,0,.3),0 16px 40px -16px rgba(0,0,0,.6);
  color-scheme:dark;
}
@media (min-width:768px){.rd{--gut:32px;font-size:19px}}
.rd *,.rd *::before,.rd *::after{box-sizing:border-box}
.rd a{color:inherit;text-decoration:none}
.rd img,.rd video{display:block;max-width:100%}
.rd h1,.rd h2,.rd h3,.rd p,.rd ul,.rd ol,.rd figure,.rd blockquote{margin:0;padding:0}
.rd ul,.rd ol{list-style:none}
.rd button{font:inherit;color:inherit;background:none;border:0;padding:0;cursor:pointer}
.rd :focus-visible{outline:2px solid var(--acc);outline-offset:3px;border-radius:8px}
.rd .wrap{width:100%;max-width:var(--max);margin-inline:auto;padding-inline:var(--gut)}
.rd .sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
.rd .ltr{direction:ltr;unicode-bidi:isolate}
.rd .head{font-family:var(--f-head);font-weight:700;letter-spacing:0;line-height:1.15;text-wrap:balance}
.rd .lead{color:var(--mut);max-width:58ch;text-wrap:pretty}
.rd .stars{display:inline-flex;gap:2px;color:var(--acc)}
.rd .stars svg{width:16px;height:16px;fill:currentColor;stroke:none}
.rd .note{font-size:14px;line-height:1.6;color:var(--mut);border:1px dashed var(--line2);border-radius:12px;padding:8px 12px;max-width:60ch}

/* buttons */
.rd .btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;height:48px;padding:0 22px;border-radius:999px;
  font-weight:600;font-size:17px;white-space:nowrap;transition:transform .35s var(--out),background-color .25s,color .25s,box-shadow .35s var(--out)}
.rd .btn:active{transform:scale(.97)}
.rd .btn-ink{background:var(--inv);color:var(--on-inv)}
.rd .btn-line{border:1px solid var(--line2);color:var(--ink)}
.rd .btn-line:hover{background:var(--card2)}
@media (hover:hover){.rd .btn-ink:hover{transform:translateY(-1px);box-shadow:0 10px 24px -10px rgba(22,18,13,.45)}}

/* header (each style restyles it) */
.rd .h{position:sticky;top:0;z-index:40}
.rd .h-in{display:flex;align-items:center;gap:12px;height:64px}
.rd .h-logo{display:flex;align-items:center;color:var(--ink);flex:none}
.rd .h-logo svg{height:20px;width:auto}
.rd .h-nav{display:none;gap:4px;margin-inline:auto}
.rd .h-nav a{padding:8px 14px;border-radius:999px;color:var(--ink2);font-size:17px;transition:background-color .2s,color .2s}
.rd .h-nav a:hover{color:var(--ink);background:var(--card2)}
.rd .h-end{display:flex;align-items:center;gap:6px;margin-inline-start:auto}
.rd .h-icon{width:40px;height:40px;border-radius:999px;display:grid;place-items:center;color:var(--ink2);transition:background-color .2s}
.rd .h-icon:hover{background:var(--card2)}
.rd .h-icon svg{width:19px;height:19px}
.rd .h-icon .sun{display:none}
.rd[data-mode="dark"] .h-icon .sun{display:block}
.rd[data-mode="dark"] .h-icon .moon{display:none}
.rd .h-login{display:none;padding:8px 14px;border-radius:999px;font-size:17px;color:var(--ink2)}
.rd .h-login:hover{color:var(--ink)}
.rd .h-cta{display:inline-flex;align-items:center;height:40px;padding:0 16px;border-radius:999px;background:var(--inv);color:var(--on-inv);font-weight:600;font-size:16px;white-space:nowrap}
.rd .h-drawer{display:grid;grid-template-rows:0fr;transition:grid-template-rows .45s var(--out)}
.rd .h-drawer>div{overflow:hidden}
.rd[data-menu="open"] .h-drawer{grid-template-rows:1fr}
.rd .h-drawer nav{display:grid;gap:2px;padding:4px 0 14px}
.rd .h-drawer a{display:flex;align-items:center;justify-content:space-between;padding:12px 4px;font-size:19px;border-bottom:1px solid var(--line)}
.rd .h-drawer a:last-child{border-bottom:0}
.rd .h-menu .x{display:none}
.rd[data-menu="open"] .h-menu .x{display:block}
.rd[data-menu="open"] .h-menu .bars{display:none}
@media (min-width:900px){
  .rd .h-nav,.rd .h-login{display:flex}
  .rd .h-menu,.rd .h-drawer{display:none}
}

/* reveal: only once the script has run, so no-JS readers see everything */
.rd.js [data-r]{opacity:0;transform:translateY(18px);transition:opacity .9s var(--out),transform .9s var(--out);transition-delay:calc(var(--i,0)*90ms)}
.rd.js [data-r].in{opacity:1;transform:none}

/* video frames */
.rd .vid{position:relative;overflow:hidden;background:var(--card2)}
.rd .vid video{width:100%;height:100%;object-fit:cover}
.rd .only-d{display:none}
@media (min-width:768px){.rd .only-d{display:block}.rd .only-m{display:none}}

/* faq */
.rd details summary{list-style:none;cursor:pointer}
.rd details summary::-webkit-details-marker{display:none}

@media (prefers-reduced-motion:reduce){
  .rd *,.rd *::before,.rd *::after{animation-duration:.001ms!important;animation-iteration-count:1!important;scroll-behavior:auto!important}
  .rd.js [data-r]{transform:none;transition:opacity .6s linear}
  .rd .btn,.rd .h-drawer{transition:none}
}
`

/* What CSS cannot do. No scroll listeners: IntersectionObserver and the
   video's own timeupdate drive everything. */
export const RUNTIME = `(function(){
var root=document.currentScript&&document.currentScript.parentElement;while(root&&!root.classList.contains('rd'))root=root.parentElement;
if(!root)return;root.classList.add('js');
var RM=matchMedia('(prefers-reduced-motion: reduce)').matches;
var $$=function(s,el){return Array.prototype.slice.call((el||root).querySelectorAll(s))};
$$('[data-theme-btn]').forEach(function(b){b.addEventListener('click',function(){root.setAttribute('data-mode',root.getAttribute('data-mode')==='dark'?'light':'dark')})});
$$('[data-menu-btn]').forEach(function(b){b.addEventListener('click',function(){var o=root.getAttribute('data-menu')==='open';root.setAttribute('data-menu',o?'':'open');b.setAttribute('aria-expanded',String(!o))})});
var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{rootMargin:'0px 0px -8% 0px',threshold:0.12});
$$('[data-r]').forEach(function(el){io.observe(el)});
var io2=new IntersectionObserver(function(es){es.forEach(function(e){e.target.classList.toggle('vis',e.isIntersecting)})},{threshold:0});
$$('[data-vis]').forEach(function(el){io2.observe(el)});
function shown(v){return v.offsetParent!==null}
function seg(v,a,b){v._a=a;v._b=b;var go=function(){try{v.currentTime=a}catch(e){}};if(v.readyState>0)go();else v.addEventListener('loadedmetadata',go,{once:true})}
$$('video').forEach(function(v){
  v.muted=true;v.playsInline=true;
  var s=v.getAttribute('data-seg');if(s){s=s.split(',').map(Number);seg(v,s[0],s[1])}
  v.addEventListener('timeupdate',function(){var b=v._b;if(b!=null&&v.currentTime>=b-0.08){if(v._onend&&v._onend())return;v.currentTime=v._a||0}if(v._tick)v._tick(v)});
  if(RM)v.setAttribute('controls','');
});
var vio=new IntersectionObserver(function(es){es.forEach(function(e){var v=e.target;if(e.isIntersecting&&!RM){var p=v.play();if(p&&p.catch)p.catch(function(){})}else v.pause()})},{threshold:0.25});
$$('video').forEach(function(v){vio.observe(v)});
function kind(v){return v.getAttribute('data-kind')||'d'}
function pair(el,attr){var a=el.getAttribute(attr);return a?a.split(',').map(Number):null}
/* feature tabs: buttons [data-tab] carry data-d / data-m segments */
$$('[data-tabs]').forEach(function(box){
  var tabs=$$('[data-tab]',box),vids=$$('video',box),panels=$$('[data-panel]',box),cur=0;
  function pick(i,user){cur=i;tabs.forEach(function(t,j){t.setAttribute('aria-selected',String(j===i));t.style.setProperty('--p','0')});
    panels.forEach(function(p,j){p.hidden=j!==i});
    vids.forEach(function(v){var s=pair(tabs[i],'data-'+kind(v));if(s)seg(v,s[0],s[1])});box._user=box._user||user}
  vids.forEach(function(v){v._onend=function(){if(!shown(v)||box._user)return false;pick((cur+1)%tabs.length);return true};
    v._tick=function(v){if(!shown(v))return;var a=v._a,b=v._b;if(b>a)tabs[cur].style.setProperty('--p',String(Math.min(1,(v.currentTime-a)/(b-a))))}});
  tabs.forEach(function(t,i){t.addEventListener('click',function(){pick(i,true)})});
  pick(0);
});
/* steps that follow a video's time: [data-step] with data-d / data-m start */
$$('[data-sync]').forEach(function(box){
  var steps=$$('[data-step]',box),vids=$$('video',box);
  vids.forEach(function(v){var prev=v._tick;v._tick=function(v){if(prev)prev(v);if(!shown(v))return;var k=kind(v),on=0;
    steps.forEach(function(s,i){if(v.currentTime>=Number(s.getAttribute('data-'+k)))on=i});
    steps.forEach(function(s,i){s.classList.toggle('on',i===on);s.classList.toggle('done',i<on)});
    var t=v.duration?v.currentTime/v.duration:0;box.style.setProperty('--t',String(t))}});
  steps.forEach(function(s){s.addEventListener('click',function(){vids.forEach(function(v){if(shown(v)){v.currentTime=Number(s.getAttribute('data-'+kind(v)));v.play()}})})});
});
/* sticky story: the block in the middle of the screen picks the video part */
$$('[data-scrolly]').forEach(function(box){
  var blocks=$$('[data-block]',box),vids=$$('video',box);
  var zone=matchMedia('(min-width:900px)').matches?box.getAttribute('data-zone-d'):box.getAttribute('data-zone-m');
  var o=new IntersectionObserver(function(es){es.forEach(function(e){if(!e.isIntersecting)return;var b=e.target;
    blocks.forEach(function(x){x.classList.toggle('on',x===b)});
    vids.forEach(function(v){var s=pair(b,'data-'+kind(v));if(s&&s[0]!==v._a){seg(v,s[0],s[1]);if(!RM){var p=v.play();if(p&&p.catch)p.catch(function(){})}}})})},{rootMargin:zone||'-48% 0px -48% 0px'});
  blocks.forEach(function(b){o.observe(b)});
});
/* rotators: one child shown at a time */
$$('[data-rotate]').forEach(function(box){
  var items=$$('[data-item]',box),i=0,ms=Number(box.getAttribute('data-rotate'))||5000,dots=$$('[data-dot]',box);
  function show(n){items.forEach(function(it,j){it.classList.toggle('on',j===n);it.classList.toggle('was',j===(n-1+items.length)%items.length)});dots.forEach(function(d,j){d.setAttribute('aria-current',String(j===n))});i=n}
  dots.forEach(function(d,j){d.addEventListener('click',function(){show(j)})});
  show(0);if(items.length>1&&!RM)setInterval(function(){if(!document.hidden)show((i+1)%items.length)},ms);
});
/* a light that follows the pointer (desktop only) */
$$('[data-spot]').forEach(function(el){var raf=0;el.addEventListener('pointermove',function(e){if(e.pointerType!=='mouse')return;cancelAnimationFrame(raf);raf=requestAnimationFrame(function(){var r=el.getBoundingClientRect();el.style.setProperty('--mx',((e.clientX-r.left)/r.width*100).toFixed(1)+'%');el.style.setProperty('--my',((e.clientY-r.top)/r.height*100).toFixed(1)+'%')})})});
/* rails: prev / next */
$$('[data-rail]').forEach(function(box){var rail=box.querySelector('[data-track]');if(!rail)return;var step=function(d){var c=rail.firstElementChild;var w=c?c.getBoundingClientRect().width+16:300;rail.scrollBy({left:d*w,behavior:RM?'auto':'smooth'})};
  $$('[data-next]',box).forEach(function(b){b.addEventListener('click',function(){step(-1)})});$$('[data-prev]',box).forEach(function(b){b.addEventListener('click',function(){step(1)})})});
})();`

export function Mark({ className, long }: { className?: string; long?: boolean }) {
  return <ZenyaMark className={className} variant={long ? 'long' : 'short'} />
}

export function Stars({ n = 5 }: { n?: number }) {
  return (
    <span className="stars" aria-label={`${n} من 5`}>
      {Array.from({ length: n }).map((_, i) => <Star key={i} aria-hidden />)}
    </span>
  )
}

export function Header({ className = '' }: { className?: string }) {
  return (
    <header className={'h ' + className}>
      <div className="wrap h-in">
        <a className="h-logo" href="/" aria-label="بينون"><Mark /></a>
        <nav className="h-nav" aria-label="الصفحات">
          {NAV.map((n) => <a key={n.href} href={n.href}>{n.label}</a>)}
        </nav>
        <div className="h-end">
          <button type="button" className="h-icon" data-theme-btn aria-label="بدّل الوضع الليلي">
            <Moon className="moon" strokeWidth={1.6} /><Sun className="sun" strokeWidth={1.6} />
          </button>
          <a className="h-login" href={AUTH.login.href}>{AUTH.login.label}</a>
          <a className="h-cta" href={AUTH.signup.href}>{AUTH.signup.label}</a>
          <button type="button" className="h-icon h-menu" data-menu-btn aria-label="القائمة" aria-expanded="false">
            <Menu className="bars" strokeWidth={1.6} /><X className="x" strokeWidth={1.6} />
          </button>
        </div>
      </div>
      <div className="wrap h-drawer"><div>
        <nav aria-label="القائمة">
          {NAV.map((n) => <a key={n.href} href={n.href}>{n.label}<ArrowUpLeft size={18} strokeWidth={1.6} /></a>)}
          <a href={AUTH.login.href}>{AUTH.login.label}<ArrowUpLeft size={18} strokeWidth={1.6} /></a>
        </nav>
      </div></div>
    </header>
  )
}

/** A muted, looping, inline recording. `kind` picks which segment attr the
 *  runtime reads (d = laptop recording, m = phone recording). */
export function Vid({ v, kind, seg, className, label }: {
  v: { src: string; poster: string; w: number; h: number }
  kind: 'd' | 'm'
  seg?: readonly number[]
  className?: string
  label: string
}) {
  return (
    <video className={className} src={v.src} poster={v.poster} width={v.w} height={v.h}
      muted loop playsInline preload="metadata" aria-label={label}
      data-kind={kind} data-seg={seg ? seg.join(',') : undefined} />
  )
}

export function FooterLinks({ className = '' }: { className?: string }) {
  return (
    <div className={'fl ' + className}>
      {FOOTER.columns.map((c) => (
        <nav key={c.head} aria-label={c.head} className="fl-col">
          <p className="fl-h">{c.head}</p>
          <ul>{c.links.map(([href, label]) => <li key={href}><a href={href}>{label}</a></li>)}</ul>
        </nav>
      ))}
    </div>
  )
}

export function Contact({ className = '' }: { className?: string }) {
  return (
    <div className={'fc ' + className}>
      <a href={'mailto:' + FOOTER.email} className="ltr">{FOOTER.email}</a>
      <a href={FOOTER.phoneHref} className="ltr">{FOOTER.phoneRead}</a>
    </div>
  )
}

export function Socials({ className = '' }: { className?: string }) {
  return (
    <ul className={'fs ' + className}>
      {FOOTER.socials.map(([label, href]) => <li key={label}><a href={href} target="_blank" rel="noopener noreferrer">{label}</a></li>)}
    </ul>
  )
}

export function Root({ id, mode, css, children }: { id: string; mode: 'light' | 'dark'; css: string; children: ReactNode }) {
  return (
    <div className={'rd ' + id} data-mode={mode} dir="rtl" lang="ar">
      <style dangerouslySetInnerHTML={{ __html: FONTS_CSS + BASE_CSS + css }} />
      {children}
      <script dangerouslySetInnerHTML={{ __html: RUNTIME }} />
    </div>
  )
}
