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
import ScriptRevive from './ScriptRevive'
import { MARK_VB_FATHA, MARK_BODY, MARK_DOTS, MARK_FATHA } from './mark'
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

/* device frames (second set) */
.rd .dv-lap{position:relative;width:100%}
.rd .dv-lid{position:relative;border-radius:clamp(10px,1.5vw,20px) clamp(10px,1.5vw,20px) 4px 4px;background:#0E0D0B;padding:clamp(5px,.85vw,12px) clamp(5px,.85vw,12px) clamp(7px,1.1vw,15px);
  box-shadow:inset 0 0 0 1px rgba(255,255,255,.09),0 0 0 1px rgba(0,0,0,.35),0 50px 90px -50px rgba(22,18,13,.6)}
.rd .dv-lid::before{content:"";position:absolute;top:clamp(2px,.33vw,5px);left:50%;width:4px;height:4px;margin-left:-2px;border-radius:50%;background:#2B2824}
.rd .dv-scr{position:relative;aspect-ratio:16/10;overflow:hidden;border-radius:3px;background:#000}
.rd .dv-scr video,.rd .dv-scr img{width:100%;height:100%;object-fit:cover}
.rd .dv-scr::after{content:"";position:absolute;inset:0;background:linear-gradient(118deg,rgba(255,255,255,.07),rgba(255,255,255,0) 38%);pointer-events:none}
.rd .dv-base{position:relative;height:clamp(9px,1.25vw,17px);margin-inline:-6.5%;border-radius:0 0 50% 50%/0 0 100% 100%;
  background:linear-gradient(#E4E0D9,#B9B3A9 55%,#8D877C);box-shadow:0 22px 40px -22px rgba(22,18,13,.55)}
.rd .dv-base::before{content:"";position:absolute;top:0;left:50%;width:15%;height:42%;translate:-50% 0;border-radius:0 0 10px 10px;background:linear-gradient(#A8A297,#C9C4BB)}
.rd[data-mode="dark"] .dv-base{background:linear-gradient(#4A4640,#2E2B27 55%,#1C1A17)}
.rd[data-mode="dark"] .dv-base::before{background:linear-gradient(#1E1C19,#36322D)}
.rd .dv-ph{position:relative;border-radius:15%/7%;padding:2.8%;background:#0E0D0B;
  box-shadow:inset 0 0 0 1.5px rgba(255,255,255,.13),0 0 0 1px rgba(0,0,0,.3),0 40px 70px -36px rgba(22,18,13,.6)}
.rd .dv-ph::after{content:"";position:absolute;top:22%;right:-1.4%;width:1.4%;height:9%;border-radius:0 3px 3px 0;background:#1C1A17}
.rd .dv-ph-scr{position:relative;aspect-ratio:390/844;overflow:hidden;border-radius:12.4%/5.8%;background:#000}
.rd .dv-ph-scr video,.rd .dv-ph-scr img{width:100%;height:100%;object-fit:cover;object-position:top}
.rd .dv-win{position:relative;border-radius:14px;overflow:hidden;background:var(--card);box-shadow:0 0 0 1px var(--line2),0 40px 80px -40px rgba(22,18,13,.45)}
.rd .dv-bar{display:flex;align-items:center;gap:6px;height:34px;padding-inline:14px;border-bottom:1px solid var(--line);background:var(--card2)}
.rd .dv-bar i{width:9px;height:9px;border-radius:50%;background:var(--line2)}
.rd .dv-bar span{margin-inline:auto;font-size:12px;line-height:1;padding:5px 14px;border-radius:999px;background:var(--card);color:var(--mut);direction:ltr}
.rd .dv-win .dv-scr{border-radius:0}

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
  function pick(i,user){cur=i;box.style.setProperty('--ix',String(i));tabs.forEach(function(t,j){t.setAttribute('aria-selected',String(j===i));t.style.setProperty('--p','0')});
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
    var at=blocks.indexOf(b);blocks.forEach(function(x,j){x.classList.toggle('on',j===at);x.classList.toggle('done',j<at)});
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
function play(v){if(RM||!shown(v))return;var p=v.play();if(p&&p.catch)p.catch(function(){})}
/* chapters: a pinned box whose scroll progress picks one [data-chap] */
$$('[data-steps]').forEach(function(box){var ch=$$('[data-chap]',box),vids=$$('video',box);box._n=ch.length;
  box._onstep=function(i){ch.forEach(function(c,j){c.classList.toggle('on',j===i);c.classList.toggle('done',j<i)});box.setAttribute('data-at',String(i));box.style.setProperty('--at',String(i));
    vids.forEach(function(v){var s=pair(ch[i],'data-'+kind(v));if(s&&s[0]!==v._a){seg(v,s[0],s[1]);play(v)}})};
  box._i=0;box._onstep(0);
  ch.forEach(function(c,j){c.addEventListener('click',function(){var r=box.getBoundingClientRect(),d=r.height-innerHeight;if(d>0)scrollTo({top:scrollY+r.top+d*(j+.5)/ch.length,behavior:RM?'auto':'smooth'})})});
});
/* scroll progress: [data-p] gets --p from 0 to 1. "pin" = across a tall
   sticky box, "enter" = while its top climbs the screen, else = in view */
var PS=$$('[data-p]'),act=[];
function upd(el){var r=el.getBoundingClientRect(),H=innerHeight,m=el.getAttribute('data-p'),p;
  if(m==='pin'){var d=r.height-H;p=d>0?-r.top/d:(r.top<0?1:0)}else if(m==='enter'){p=(H-r.top)/(H*.85)}else if(m==='rise'){p=(H-r.top)/(H*.7)}else if(m==='end'){p=(H-r.top)/Math.min(r.height,H*.9)}else{p=(H-r.top)/(H+r.height)}
  p=p<0?0:p>1?1:p;if(el._p!==undefined&&Math.abs(el._p-p)<.0004)return;el._p=p;el.style.setProperty('--p',p.toFixed(4));
  if(el._n){var i=Math.min(el._n-1,Math.floor(p*el._n));if(i!==el._i){el._i=i;el._onstep(i)}}}
var pio=new IntersectionObserver(function(es){es.forEach(function(e){var k=act.indexOf(e.target);if(e.isIntersecting){if(k<0)act.push(e.target)}else{if(k>=0)act.splice(k,1);upd(e.target)}})},{rootMargin:'25% 0px 25% 0px'});
PS.forEach(function(el){pio.observe(el);upd(el)});
var tk=0;function frame(){tk=0;act.forEach(upd);root.classList.toggle('scrolled',scrollY>8)}
addEventListener('scroll',function(){if(!tk)tk=requestAnimationFrame(frame)},{passive:true});
addEventListener('resize',function(){if(!tk)tk=requestAnimationFrame(frame)});frame();
/* coverflow: each [data-fi] learns how far it sits from the rail's centre */
$$('[data-flow]').forEach(function(rail){var items=$$('[data-fi]',rail),t=0;
  function f(){t=0;var r=rail.getBoundingClientRect(),c=r.left+r.width/2;items.forEach(function(it){var b=it.getBoundingClientRect(),d=(b.left+b.width/2-c)/(b.width||1);d=d<-3?-3:d>3?3:d;it.style.setProperty('--d',d.toFixed(3));it.style.setProperty('--ad',Math.abs(d).toFixed(3));it.classList.toggle('mid',Math.abs(d)<.5)})}
  rail.addEventListener('scroll',function(){if(!t)t=requestAnimationFrame(f)},{passive:true});addEventListener('resize',f);
  items.forEach(function(it){it.addEventListener('click',function(e){if(!it.classList.contains('mid')){e.preventDefault();var b=it.getBoundingClientRect(),r=rail.getBoundingClientRect();rail.scrollBy({left:(b.left+b.width/2)-(r.left+r.width/2),behavior:RM?'auto':'smooth'})}})});
  var mid=rail.getAttribute('data-flow');if(mid&&items[+mid]){var b=items[+mid].getBoundingClientRect(),r=rail.getBoundingClientRect();rail.scrollLeft+=(b.left+b.width/2)-(r.left+r.width/2)}f();
});
/* depth: [data-tilt] gets --tx / --ty in -1..1 from the mouse */
$$('[data-tilt]').forEach(function(el){var raf=0;el.addEventListener('pointermove',function(e){if(e.pointerType!=='mouse'||RM)return;cancelAnimationFrame(raf);raf=requestAnimationFrame(function(){var r=el.getBoundingClientRect();el.style.setProperty('--tx',((e.clientX-r.left)/r.width*2-1).toFixed(3));el.style.setProperty('--ty',((e.clientY-r.top)/r.height*2-1).toFixed(3))})});
  el.addEventListener('pointerleave',function(){el.style.setProperty('--tx','0');el.style.setProperty('--ty','0')})});
/* a brief that types itself, then the site it becomes: [data-gen] > [data-type] */
$$('[data-gen]').forEach(function(box){var el=box.querySelector('[data-type]');if(!el)return;var txt=el.getAttribute('data-type'),i=0,run=false,tm;
  function reset(){i=0;el.textContent='';box.classList.remove('typed','built')}
  function step(){if(!run)return;if(i<=txt.length){el.textContent=txt.slice(0,i);i++;tm=setTimeout(step,i<4?160:28+Math.random()*34)}else{box.classList.add('typed');tm=setTimeout(function(){box.classList.add('built');tm=setTimeout(function(){reset();step()},9000)},1500)}}
  new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting&&!run){run=true;if(RM){el.textContent=txt;box.classList.add('typed','built')}else{reset();step()}}else if(!e.isIntersecting&&run){run=false;clearTimeout(tm)}})},{threshold:.35}).observe(box);
});
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

export function Header({ className = '', dots = false }: { className?: string; dots?: boolean }) {
  return (
    <header className={'h ' + className}>
      <div className="wrap h-in">
        <a className="h-logo" href="/" aria-label="بينون">{dots ? <MarkDots /> : <Mark />}</a>
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

/** Single-colour platform marks (2026-11-05, option A): the icon alone, the
 *  name kept for screen readers and as a tooltip. */
const SOCIAL_PATHS: Record<string, string> = {
  TikTok: 'M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.27 8.27 0 004.84 1.55V6.79a4.85 4.85 0 01-1.07-.1z',
  Instagram: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z',
  X: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z',
  Facebook: 'M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z',
  Threads: 'M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.964-.065-1.19.408-2.285 1.33-3.082.88-.76 2.119-1.207 3.583-1.291a13.853 13.853 0 0 1 3.02.142c-.126-.742-.375-1.332-.75-1.757-.513-.586-1.308-.883-2.359-.89h-.029c-.844 0-1.992.232-2.721 1.32L7.734 7.847c.98-1.454 2.568-2.256 4.478-2.256h.044c3.194.02 5.097 1.975 5.287 5.388.108.046.216.094.321.142 1.49.7 2.58 1.761 3.154 3.07.797 1.82.871 4.79-1.548 7.158-1.85 1.81-4.094 2.628-7.277 2.65Zm1.003-11.69c-.242 0-.487.007-.739.021-1.836.103-2.98.946-2.916 2.143.067 1.256 1.452 1.839 2.784 1.767 1.224-.065 2.818-.543 3.086-3.71a10.5 10.5 0 0 0-2.215-.221z',
}

export function Socials({ className = '' }: { className?: string }) {
  return (
    <ul className={'fs ' + className}>
      {FOOTER.socials.map(([label, href]) => (
        <li key={label}>
          <a href={href} target="_blank" rel="noopener noreferrer" aria-label={label} title={label}>
            {SOCIAL_PATHS[label]
              ? <svg viewBox="0 0 24 24" width="19" height="19" fill="currentColor" aria-hidden><path d={SOCIAL_PATHS[label]} /></svg>
              : label}
          </a>
        </li>
      ))}
    </ul>
  )
}

/** Device frames for the second set: real bezels, so a recording reads as a
 *  product and not as a picture of one. */
export function Laptop({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={'dv-lap ' + className}><div className="dv-lid"><div className="dv-scr">{children}</div></div><div className="dv-base" aria-hidden /></div>
}
export function Phone({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={'dv-ph ' + className}><div className="dv-ph-scr">{children}</div></div>
}
export function Browser({ children, className = '', url = 'beynoun.com' }: { children: ReactNode; className?: string; url?: string }) {
  return <div className={'dv-win ' + className}><div className="dv-bar" aria-hidden><i /><i /><i /><span>{url}</span></div><div className="dv-scr">{children}</div></div>
}

/** One span per word, each knowing its place (--w) and the count (--n). */
export function Words({ text, className = '' }: { text: string; className?: string }) {
  const ws = text.split(' ')
  return <span className={className} style={{ ['--n' as string]: ws.length }}>{ws.map((w, i) => <span key={i} className="w" style={{ ['--w' as string]: i }}>{w}{i < ws.length - 1 ? ' ' : ''}</span>)}</span>
}

/** "$14.99" set as a price: a small raised currency, the whole number, a
 *  smaller decimal. Left to right inside the RTL page. */
export function Amount({ v, className = '' }: { v: string; className?: string }) {
  const m = /^\$(\d+)(\.\d+)?$/.exec(v)
  if (!m) return <span className={'amt-v ltr ' + className}>{v}</span>
  return <span className={'amt-v ltr ' + className}><span className="cur">$</span>{m[1]}{m[2] ? <span className="dec">{m[2]}</span> : null}</span>
}

export function Root({ id, mode, css, children }: { id: string; mode: 'light' | 'dark'; css: string; children: ReactNode }) {
  return (
    <div className={'rd ' + id} data-mode={mode} dir="rtl" lang="ar">
      <style dangerouslySetInnerHTML={{ __html: FONTS_CSS + BASE_CSS + css }} />
      {children}
      <script dangerouslySetInnerHTML={{ __html: RUNTIME }} />
      <ScriptRevive />
    </div>
  )
}

/** The wordmark with orange dots (logo pack, 2026-10-24) and the icon's fatha over the ب. */
export function MarkDots({ className = '' }: { className?: string }) {
  return (
    <svg viewBox={MARK_VB_FATHA} role="img" aria-label="بينون" className={'mk ' + className} preserveAspectRatio="xMidYMid meet">
      <path fillRule="evenodd" d={MARK_BODY} fill="currentColor" />
      <path d={MARK_DOTS} fill="var(--dot,#E2532A)" />
      <path d={MARK_FATHA} fill="var(--dot,#E2532A)" />
    </svg>
  )
}
