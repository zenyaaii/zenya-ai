/**
 * Style 11 — style 1 «ليل», chosen by Anas on 2026-11-01, with his edits:
 *  1. the dashboard is style 2's scroll story, made finer, and it opens like
 *     style 7's band. The band takes the other mode's colour: paper on the
 *     dark page, ink on the light one
 *  2. the hero is style 9's layout and its entrance, on style 1's light
 *     (hero "b" keeps style 1's own centred hero with the same entrance)
 *  3. pricing: Starter carries the outline, and the glass reads in light mode
 *  4. the editor is style 10's window with its steps floating around it
 *  5. the templates are style 7's strips
 *  6. the wordmark's dots are orange, as on the icon
 *  7. pricing gets the live page's discount stack and comparison
 * Plus the templates and contact pages, with every section the live ones
 * have. No section ends on a hard edge: the light fades out before it.
 */
import { Fragment } from 'react'
import {
  Home as HomeIc, BarChart3, CalendarDays, Star as StarIc, Search, Mail, Phone as PhoneIc, Globe, Clock,
  Building2, LifeBuoy, Sparkles, MessageSquareQuote, Briefcase, MessageCircle, ArrowUpLeft as Arrow,
} from 'lucide-react'
import { Root, Header, Vid, Stars, FooterLinks, Contact, Socials, MarkDots, Check, Plus, Laptop, Phone, Browser } from './base'
import { CSS as S1_CSS } from './s1'
import {
  HERO, REVIEWS, REVIEWS_NOTE, DASH_D, DASH_M, EDIT_D, EDIT_M, DASH_FEATURES, EDIT_STEPS, TEMPLATES, phoneShot, wideShot,
  FAQS, PRICING_FAQS, PRICING_HEAD, PLANS, FOOTER, SECTIONS, bigShot, TEMPLATE_META, TEMPLATES_HEAD, TEMPLATE_TOTALS, FLOOR,
  COMPARE, DISCOUNTS, WHY, CONTACT,
} from './data'

const FEAT_ICONS = [HomeIc, BarChart3, CalendarDays, StarIc, Search]
const TOPIC_ICONS = [LifeBuoy, Sparkles, MessageSquareQuote, Briefcase, MessageCircle]
const AR = ['٠١', '٠٢', '٠٣', '٠٤', '٠٥']
const NUM = ['١', '٢', '٣', '٤']
const READY = [...TEMPLATE_META.filter((t) => !('soon' in t && t.soon)), ...TEMPLATE_META.filter((t) => 'soon' in t && t.soon)]

const CSS = `
.s11 .mk{display:block}
.rd.s11 .h-logo svg{height:24px}
.rd.s11 .s1-fbrand>a svg{height:31px}
.s11 .s1-fmark{height:clamp(100px,20vw,272px)}
.s11 .s1-fmark svg{transform:translateY(52%)}
.s11 .s1-fmark.vis svg{transform:translateY(6%)}
.rd.shot.s11 .s1-fmark svg{transform:translateY(6%)!important}
.s11 .h-in{transition:background-color .45s,border-color .45s}
.s11-sec{position:relative;padding-block:88px}
@media (min-width:900px){.s11-sec{padding-block:120px}}
.s11 .sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}

/* the light never ends on a line: it runs past its section and fades out */
.s11-sky{inset:0 0 -26% 0;-webkit-mask-image:linear-gradient(#000 0,#000 50%,transparent 96%);mask-image:linear-gradient(#000 0,#000 50%,transparent 96%)}

/* hero (style 9's layout and entrance) */
.s11-hero{position:relative;isolation:isolate;margin-top:-66px;padding-top:calc(66px + clamp(40px,6vw,80px));padding-bottom:clamp(40px,6vw,88px)}
.s11-hero>.wrap{position:relative;z-index:1}
.s11-hg{display:grid;gap:clamp(40px,5vw,56px);align-items:center}
@media (min-width:1000px){.s11-hg{grid-template-columns:minmax(0,1fr) minmax(0,1.08fr);min-height:calc(100svh - 190px)}}
.s11-htxt{display:grid;gap:22px;justify-items:start}
.s11-h1{font-size:clamp(56px,8.4vw,118px);line-height:1.08;display:flex;flex-wrap:wrap;gap:0 .24em}
.s11-h1 span{display:inline-block}
.s11-h1 span:last-child{color:var(--acc-ink)}
.rd.js .s11-h1 span{opacity:0;transform:translateY(30px) rotate(-2deg);animation:s11in 1s cubic-bezier(.2,.9,.25,1.15) forwards;animation-delay:calc(.12s + var(--i)*.12s)}
@keyframes s11in{to{opacity:1;transform:none}}
.rd.js .s11-fade{opacity:0;animation:s11f .9s var(--out) forwards;animation-delay:var(--d,.55s)}
@keyframes s11f{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
.s11-htxt .lead{max-width:34ch;font-size:clamp(18px,1.7vw,21px)}
.s11-ctas{display:flex;flex-wrap:wrap;gap:10px}
.s11-stack{position:relative;height:clamp(420px,44vw,600px)}
.s11-stack::before{content:"";position:absolute;inset:12% 6% 0;background:radial-gradient(closest-side,var(--glow),transparent);filter:blur(50px);opacity:.55;pointer-events:none}
.s11-ly{position:absolute;transition:transform 1s var(--out)}
.s11-ly.a{inset-inline-end:0;top:4%;width:88%;transform:translate(calc(var(--tx,0) * 10px),calc(var(--ty,0) * 8px))}
.s11-ly.b{inset-inline-start:2%;bottom:0;width:31%;transform:translate(calc(var(--tx,0) * 26px),calc(var(--ty,0) * 20px))}
.s11-ly.c{inset-inline-end:3%;bottom:7%;width:34%;transform:translate(calc(var(--tx,0) * 18px),calc(var(--ty,0) * 14px))}
.s11-ly.a .dv-lap{filter:drop-shadow(0 40px 50px rgba(0,0,0,.45))}
.s11-ly.b .dv-ph{animation:s11float 8s ease-in-out infinite -2s;box-shadow:0 40px 60px -24px rgba(0,0,0,.6)}
.s11-chip{border-radius:18px;padding:6px;animation:s11float 7s ease-in-out infinite;box-shadow:0 30px 50px -24px rgba(0,0,0,.5)}
.s11-chip img{width:100%;aspect-ratio:16/10;object-fit:cover;object-position:top;border-radius:13px}
.s11-chip p{padding:8px 10px 4px;font-size:14.5px;display:flex;justify-content:space-between;gap:8px}
.s11-chip p span{color:var(--mut)}
@keyframes s11float{50%{transform:translateY(-10px)}}
@media (max-width:999px){
  .s11-stack{height:auto;display:grid;justify-items:start;padding-inline-start:6%}
  .s11-ly{transform:none}
  .s11-ly.a{display:none}
  .s11-ly.b{position:relative;inset:auto;width:min(236px,60vw)}
  .s11-ly.c{top:auto;inset-inline-start:auto;inset-inline-end:0;bottom:12%;width:min(196px,47vw);z-index:2}
}
/* hero b: style 1's own, with the same entrance */
.s11-hb{position:relative;margin-top:-66px;padding-top:66px;min-height:100svh;display:grid;align-items:center;isolation:isolate}
.s11-hb .s1-hero-in{padding-block:48px 88px}
.s11-h1b{font-size:clamp(54px,11vw,128px);line-height:1.08;display:flex;flex-wrap:wrap;justify-content:center;gap:0 .28em}

/* dashboard: the scroll story, inside a band that opens from a slit */
.s11-bandsec{position:relative;padding-block:clamp(16px,3vw,40px)}
.s11-band{position:relative;margin-inline:clamp(8px,1.4vw,20px);border-radius:36px;padding-block:clamp(72px,9vw,124px);background:var(--bg);color:var(--ink);
  box-shadow:0 0 0 1px var(--line);
  clip-path:inset(0 calc((1 - var(--p,1)) * 38%) 0 calc((1 - var(--p,1)) * 38%) round calc(36px + (1 - var(--p,1)) * 200px))}
.rd[data-mode="dark"].onband .h,.rd[data-mode="dark"] .s11-band{--bg:#F4EFE6;--bg2:#EFE9DE;--card:#FFFDF9;--card2:#F1EBE1;--card3:#E6DED0;--ink:#16120D;--ink2:#3B342C;--mut:#5F574D;--mut2:#8A8074;--line:rgba(22,18,13,.09);--line2:rgba(22,18,13,.16);--acc-ink:#B23A17;--glass:rgba(255,253,249,.6);--glass-line:rgba(22,18,13,.1);color-scheme:light}
.rd[data-mode="light"].onband .h,.rd[data-mode="light"] .s11-band{--bg:#16120D;--bg2:#13110E;--card:#1F1B16;--card2:#24201A;--card3:#2E2922;--ink:#F4EFE6;--ink2:#DAD1C4;--mut:#A39A8D;--mut2:#7E766B;--line:rgba(244,239,230,.08);--line2:rgba(244,239,230,.16);--acc-ink:#F07A52;--glass:rgba(26,23,19,.55);--glass-line:rgba(244,239,230,.12);color-scheme:dark}
.rd[data-mode="light"] .s11-band .dv-base{background:linear-gradient(#4A4640,#2E2B27 55%,#1C1A17)}
.rd[data-mode="dark"] .s11-band .dv-base{background:linear-gradient(#DCD7CE,#BDB7AD 55%,#9F998F)}
.rd[data-mode="dark"] .s11-band .dv-base::before{background:linear-gradient(#A8A297,#C9C4BB)}
.s11-bhd{display:grid;gap:14px;justify-items:center;text-align:center;margin-bottom:clamp(20px,4vw,56px)}
.s11-sc{display:grid}
@media (min-width:900px){.s11-sc{grid-template-columns:minmax(0,.82fr) minmax(0,1.18fr);gap:clamp(40px,5vw,72px)}}
.s11-media{position:sticky;top:72px;z-index:2;align-self:start;padding-block:6px 0;background:var(--bg)}
.s11-media::after{content:"";position:absolute;inset-inline:0;top:100%;height:44px;background:linear-gradient(var(--bg),transparent);pointer-events:none}
@media (min-width:900px){.s11-media{top:calc(50svh - 230px);order:2;background:none}.s11-media::after{display:none}}
.s11-dev{position:relative;isolation:isolate;padding-bottom:6%}
.s11-dev::before{content:"";position:absolute;inset:6% 4% 0;border-radius:40px;background:radial-gradient(closest-side,rgba(226,83,42,.28),transparent);filter:blur(40px);z-index:-1}
.s11-dev .dv-lap{width:94%;margin-inline-start:auto}
.s11-mini{position:absolute;inset-inline-start:0;bottom:0;width:21%;filter:drop-shadow(0 24px 30px rgba(0,0,0,.35))}
.s11-devm{display:grid;justify-items:center}
.s11-devm .dv-ph{width:min(168px,42vw)}
.s11-cap{display:none}
@media (max-width:899px){.s11-cap{display:flex;justify-content:center;gap:6px;margin-top:12px}
  .s11-cap i{width:22px;height:3px;border-radius:2px;background:var(--line2);transition:background-color .4s,width .4s}}
.s11-blocks{list-style:none;position:relative}
.s11-block{position:relative;min-height:46svh;display:grid;grid-template-columns:auto 1fr;gap:4px 16px;align-content:center;padding-block:28px;opacity:.3;transition:opacity .6s var(--out)}
@media (min-width:900px){.s11-block{min-height:64svh}}
.s11-block.on{opacity:1}
.s11-block .n{grid-row:span 2;font-family:var(--f-head);font-size:15px;color:var(--mut);padding-top:10px;min-width:2ch}
.s11-block h3{font-family:var(--f-head);font-size:clamp(28px,3.2vw,40px);line-height:1.2;display:flex;align-items:center;gap:12px}
.s11-block h3 svg{flex:none;width:38px;height:38px;padding:9px;border-radius:12px;background:var(--card);box-shadow:0 0 0 1px var(--line2);color:var(--ink2);transition:background-color .5s,color .5s,box-shadow .5s}
.s11-block.on h3 svg{background:var(--acc);color:#FFFBF7;box-shadow:0 10px 24px -10px rgba(226,83,42,.8)}
.s11-block p{color:var(--mut);max-width:38ch;font-size:18px}
.s11-block::before{content:"";position:absolute;inset-inline-start:-18px;top:50%;width:2px;height:0;border-radius:2px;background:var(--acc);translate:0 -50%;transition:height .6s var(--out)}
.s11-block.on::before{height:38%}
@media (max-width:899px){.s11-block::before{display:none}}

/* editor: style 10's window with the steps floating around it */
.s11-ew{position:relative;isolation:isolate;max-width:980px;margin-inline:auto}
.s11-ew::before{content:"";position:absolute;inset:10% 8% -2%;background:radial-gradient(closest-side,var(--glow),transparent);filter:blur(50px);opacity:.6;z-index:-1}
.s11-ew .dv-win{box-shadow:0 0 0 1px var(--glass-line),0 50px 90px -40px rgba(0,0,0,.6)}
.s11-ew .dv-bar{background:var(--card2)}
.s11-ew .dv-ph{width:min(250px,64vw);margin-inline:auto}
.s11-chips{list-style:none}
.s11-chip2{display:flex;align-items:center;gap:10px;padding:9px 16px 9px 10px;border-radius:999px;cursor:pointer;white-space:nowrap;transition:transform .5s var(--out),box-shadow .5s,border-color .5s}
.s11-chip2 i{width:30px;height:30px;border-radius:50%;display:grid;place-items:center;font-style:normal;font-family:var(--f-head);font-weight:700;background:var(--card3);color:var(--mut);transition:background-color .4s,color .4s}
.s11-chip2 b{font-family:var(--f-head);font-size:20px;font-weight:700}
.s11-chip2 span{font-size:15px;color:var(--mut)}
.s11-chip2.on{border-color:color-mix(in srgb,var(--acc) 70%,transparent);box-shadow:0 0 0 1px var(--acc),0 18px 40px -18px var(--glow)}
.s11-chip2.on i{background:var(--acc);color:#FFFBF7}
.s11-chip2.done i{background:var(--ink);color:var(--bg)}
@media (min-width:960px){
  .s11-chips{position:absolute;inset:0;pointer-events:none}
  .s11-chip2{position:absolute;pointer-events:auto;animation:s11bob 6s ease-in-out infinite}
  .s11-chip2.on{transform:scale(1.06)}
  .s11-chip2:nth-child(1){top:8%;inset-inline-start:-7%}
  .s11-chip2:nth-child(2){top:38%;inset-inline-end:-8%;animation-delay:-1.5s}
  .s11-chip2:nth-child(3){bottom:26%;inset-inline-start:-9%;animation-delay:-3s}
  .s11-chip2:nth-child(4){bottom:-5%;inset-inline-end:8%;animation-delay:-4.5s}
}
@keyframes s11bob{50%{translate:0 -8px}}
@media (max-width:959px){.s11-chips{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:20px}.s11-chip2 span{display:none}}

/* templates: style 7's strips */
.s11-strips{display:flex;gap:10px;height:clamp(440px,44vw,580px)}
.s11-strip{position:relative;flex:1;min-width:0;border-radius:22px;overflow:hidden;cursor:pointer;background:var(--card2);box-shadow:0 0 0 1px var(--glass-line);transition:flex-grow .9s cubic-bezier(.77,0,.18,1)}
.s11-strip.on{flex-grow:5.4}
.s11-strip img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:top;filter:saturate(.55) brightness(.72);transform:scale(1.04);transition:filter .9s,transform 1.2s var(--out)}
.s11-strip.on img{filter:none;transform:none}
.s11-strip .lab{position:absolute;inset-inline:0;bottom:18px;text-align:center;color:#F4EFE6;font-size:15px;font-weight:600;transition:opacity .4s;text-shadow:0 1px 8px rgba(0,0,0,.5)}
.s11-strip.on .lab{opacity:0}
.s11-strip .cap{position:absolute;inset-inline:12px;bottom:12px;padding:14px 16px;border-radius:16px;display:flex;align-items:end;justify-content:space-between;gap:12px;
  background:rgba(16,13,10,.55);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);border:1px solid rgba(244,239,230,.14);color:#F4EFE6;opacity:0;transform:translateY(10px);transition:opacity .5s,transform .6s var(--out)}
.s11-strip.on .cap{opacity:1;transform:none;transition-delay:.35s}
.s11-strip .cap strong{display:block;font-family:var(--f-head);font-size:24px;font-weight:700;white-space:nowrap;line-height:1.3}
.s11-strip .cap small{font-size:14px;opacity:.8;white-space:nowrap}
.rd .s11-strip .cap a{flex:none;display:inline-flex;align-items:center;gap:6px;height:40px;padding:0 16px;border-radius:999px;background:#F4EFE6;color:#16120D;font-size:15px;font-weight:600}
.s11-strip .cap a svg{width:15px;height:15px}
.s11-strip em{position:absolute;top:12px;inset-inline-start:12px;font-style:normal;font-size:12px;background:#F4EFE6;color:#16120D;border-radius:999px;padding:2px 10px}
.s11-tpfoot{display:flex;justify-content:center;margin-top:28px}
@media (max-width:767px){
  .s11-strips{flex-direction:column;height:auto;gap:8px}
  .s11-strip{flex:none;height:62px;transition:height .8s cubic-bezier(.77,0,.18,1)}
  .s11-strip.on{height:460px}
  .s11-strip:not(.on) img{object-position:center 16%;filter:saturate(.4) brightness(.6) blur(3px)}
  .s11-strip .lab{inset:0;display:flex;align-items:center;justify-content:space-between;padding-inline:18px;background:linear-gradient(90deg,rgba(16,13,10,.45),rgba(16,13,10,.78));font-size:18px;text-align:start}
  .s11-strip .lab::after{content:"+";font-weight:400;font-size:22px;opacity:.7}
  .s11-strip .cap{flex-direction:column;align-items:stretch}
  .rd .s11-strip .cap a{justify-content:center}
}

/* pricing: Starter carries the outline; the glass has something to blur */
.s11 .s1-pr{padding-bottom:40px}
.s11-orbs{position:absolute;inset:-6% -4%;z-index:-1;pointer-events:none}
.s11-orbs i{position:absolute;border-radius:50%;filter:blur(46px);animation:s1c 18s ease-in-out infinite alternate}
.s11-orbs .o1{width:min(46vw,520px);aspect-ratio:1;left:50%;top:6%;translate:-50% 0;background:radial-gradient(closest-side,#E2532A,rgba(226,83,42,0));opacity:.55}
.s11-orbs .o2{width:min(34vw,380px);aspect-ratio:1;left:4%;top:34%;background:radial-gradient(closest-side,#F2A15C,rgba(242,161,92,0));opacity:.45;animation-duration:24s}
.s11-orbs .o3{width:min(30vw,340px);aspect-ratio:1;right:2%;top:46%;background:radial-gradient(closest-side,#C9442A,rgba(201,68,42,0));opacity:.4;animation-duration:21s;animation-direction:alternate-reverse}
.rd.s11[data-mode="light"] .s11-orbs .o1{opacity:.75}
.rd.s11[data-mode="light"] .s11-orbs .o2{opacity:.7}
.rd.s11[data-mode="light"] .s11-orbs .o3{opacity:.55}
.s11 .s1-card.glass{-webkit-backdrop-filter:blur(26px) saturate(1.5);backdrop-filter:blur(26px) saturate(1.5)}
.rd.s11[data-mode="light"] .s1-card.glass{background:rgba(255,253,249,.4);border-color:rgba(255,255,255,.75);box-shadow:inset 0 1px 0 rgba(255,255,255,.95),0 30px 60px -30px rgba(120,50,20,.35)}
.rd.s11[data-mode="dark"] .s1-card.glass{background:rgba(26,23,19,.45);box-shadow:inset 0 1px 0 rgba(244,239,230,.08),0 30px 60px -30px rgba(0,0,0,.6)}
.s11 .s1-card.hi{border:1.5px solid var(--acc)!important;box-shadow:0 0 0 5px color-mix(in srgb,var(--acc) 14%,transparent),0 30px 80px -24px var(--glow)!important}
.rd.s11 .s1-card.hi .btn{background:var(--acc);color:#FFFBF7}
.s11 .s1-card .badge{background:var(--acc);color:#FFFBF7}

/* discounts: a fan that opens when it arrives (a deck on the phone) */
.s11-fan{position:relative}
.s11-dc{display:flex;flex-direction:column;gap:6px;border-radius:26px;padding:24px;min-height:340px}
.s11-dc .chip{align-self:flex-start;font-size:13px;padding:3px 12px;border-radius:999px;background:var(--card3);color:var(--ink2)}
.s11-dc[data-kind="code"] .chip{background:var(--acc);color:#FFFBF7}
.s11-dc .fig{font-family:var(--f-head);font-size:clamp(46px,5vw,60px);line-height:1.1;margin-top:20px}
.s11-dc[data-kind="code"] .fig{color:var(--acc-ink)}
.s11-dc .fsub{font-size:19px;color:var(--ink2)}
.s11-dc .body{margin-top:auto;padding-top:14px;color:var(--mut);font-size:16.5px;line-height:1.7}
.rd .s11-dc .go{display:inline-flex;align-items:center;justify-content:center;gap:8px;height:46px;margin-top:14px;border-radius:999px;background:var(--acc);color:#FFFBF7;font-weight:600;font-size:16.5px}
.s11-dc .go svg{width:16px;height:16px}
.s11-dc[data-kind="code"]{border-color:color-mix(in srgb,var(--acc) 60%,transparent)}
.s11-ffoot{text-align:center;color:var(--mut);font-size:16px;margin-top:28px}
.s11-pips{display:none}
@media (min-width:768px){
  .s11-fan{height:470px}
  .s11-dc{position:absolute;top:40px;left:50%;width:300px;margin-left:-150px;z-index:var(--z);
    transform:translateX(calc((1 - var(--pos)) * 10px)) translateY(calc(var(--ad) * 6px)) rotate(calc((1 - var(--pos)) * 2deg));
    transition:transform 1s cubic-bezier(.2,.9,.25,1.08),translate .45s var(--out);transition-delay:calc(var(--ad) * 80ms),0s}
  .s11-fan.vis .s11-dc{transform:translateX(calc((1 - var(--pos)) * 276px)) translateY(calc(var(--ad) * 22px)) rotate(calc((1 - var(--pos)) * 5deg))}
  .s11-fan.vis .s11-dc:hover{translate:0 -14px}
}
@media (max-width:767px){
  .s11-fan{display:grid;padding:4px 0 10px}
  .s11-dc{grid-area:1/1;width:min(300px,80vw);margin-inline:auto;transform:translateX(-13%) rotate(-5deg) scale(.9);opacity:.55;z-index:1;transition:transform .7s var(--out),opacity .7s}
  .s11-dc.was{transform:translateX(13%) rotate(5deg) scale(.9)}
  .s11-dc.on{transform:none;opacity:1;z-index:3}
  .s11-pips{display:flex;justify-content:center;gap:8px;margin-top:14px}
  .rd .s11-pips button{width:9px;height:9px;border-radius:50%;background:var(--line2);transition:background-color .3s,transform .3s}
  .rd .s11-pips button[aria-current="true"]{background:var(--acc);transform:scale(1.3)}
}

/* why: one standing column for Beynoun */
.s11-why{border-radius:28px;padding:clamp(8px,1.4vw,16px)}
.s11-tbl{width:100%;border-collapse:separate;border-spacing:0;font-size:17px}
.s11-tbl th,.s11-tbl td{padding:18px 20px;text-align:start;border-bottom:1px solid var(--line)}
.s11-tbl thead th{font-weight:600;color:var(--mut);font-size:15px;border-bottom:1px solid var(--line2)}
.s11-tbl tbody th{font-family:var(--f-head);font-weight:700;font-size:19px}
.s11-tbl tbody tr:last-child>*{border-bottom:0}
.s11-tbl .z{background:color-mix(in srgb,var(--acc) 11%,transparent);color:var(--ink);font-weight:600}
.s11-tbl thead .z{border-radius:18px 18px 0 0;color:var(--ink)}
.s11-tbl thead .z .mk{height:24px;width:auto}
.s11-tbl tbody tr:last-child .z{border-radius:0 0 18px 18px}
.s11-tbl td.z svg{display:inline-block;vertical-align:-3px;width:18px;height:18px;margin-inline-end:8px;color:var(--acc)}
.s11-tbl td:not(.z){color:var(--mut)}
@media (max-width:699px){
  .s11-why{padding:0;background:none!important;border:0!important;-webkit-backdrop-filter:none!important;backdrop-filter:none!important}
  .s11-tbl thead{display:none}
  .s11-tbl,.s11-tbl tbody{display:block}
  .s11-tbl tr{display:grid;gap:4px;padding:16px;margin-bottom:10px;border-radius:22px;background:var(--glass);border:1px solid var(--glass-line);-webkit-backdrop-filter:blur(18px);backdrop-filter:blur(18px)}
  .s11-tbl tbody th{padding:0 4px 8px;border:0}
  .s11-tbl td{display:flex;justify-content:space-between;gap:12px;padding:10px 12px;border:0;border-radius:12px}
  .s11-tbl td::before{content:attr(data-label);color:var(--mut);font-weight:400}
  .s11-tbl tbody tr:last-child .z,.s11-tbl .z{border-radius:12px}
  .s11-tbl td.z svg{display:none}
}

/* templates page */
.s11-ph{position:relative;isolation:isolate;margin-top:-66px;padding-top:calc(66px + clamp(56px,8vw,112px));padding-bottom:clamp(40px,5vw,72px)}
.s11-ph>.wrap{position:relative;z-index:1}
.s11-phg{display:grid;gap:28px;align-items:end}
@media (min-width:960px){.s11-phg{grid-template-columns:minmax(0,1.3fr) minmax(0,.7fr)}}
.s11-say{display:grid;gap:18px;justify-items:start}
.s11-ph1{font-size:clamp(46px,7vw,92px);line-height:1.1}
.s11-ph1 span{color:var(--mut)}
.s11-tally{border-radius:24px;padding:18px 20px;display:grid;gap:10px}
.s11-tally p{font-size:14px;color:var(--mut)}
.s11-tally dl{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:0}
.s11-tally dl div{display:grid;gap:0}
.s11-tally dt{font-size:15px;color:var(--mut);order:2}
.s11-tally dd{margin:0;font-family:var(--f-head);font-size:clamp(36px,4vw,48px);line-height:1.1;order:1}
.s11-grid{display:grid;gap:18px;grid-template-columns:repeat(6,minmax(0,1fr))}
.s11-tile{grid-column:span 2;border-radius:26px;padding:8px;display:grid;gap:0;position:relative;transition:transform .5s var(--out),box-shadow .5s}
.s11-tile.big{grid-column:span 3}
@media (hover:hover){.s11-tile:hover{transform:translateY(-6px);box-shadow:0 30px 60px -30px var(--glow)}}
.s11-shot{position:relative;border-radius:19px;overflow:hidden;aspect-ratio:16/10;background:var(--card2)}
.s11-shot>img{width:100%;height:100%;object-fit:cover;object-position:top;transition:transform 1.2s var(--out)}
@media (hover:hover){.s11-tile:hover .s11-shot>img{transform:scale(1.03)}}
.s11-shot .ph{position:absolute;inset-inline-end:5%;bottom:-10%;width:17%;border-radius:14px;padding:3px;background:#0E0D0B;box-shadow:0 20px 30px -10px rgba(0,0,0,.6);transition:translate .8s var(--out)}
.s11-tile.big .s11-shot .ph{width:14%}
.s11-shot .ph img{border-radius:11px;aspect-ratio:480/1039;object-fit:cover;object-position:top;width:100%}
@media (hover:hover){.s11-tile:hover .s11-shot .ph{translate:0 -8%}}
.s11-blur{filter:blur(6px) saturate(.6);transform:scale(1.06)}
.s11-veil{position:absolute;inset:0;display:grid;place-items:center;background:color-mix(in srgb,var(--bg) 35%,transparent)}
.s11-veil span{padding:6px 16px;border-radius:999px;background:var(--ink);color:var(--bg);font-size:15px;font-weight:600}
.s11-tb{display:grid;gap:6px;padding:16px 14px 10px}
.s11-tb .tag{font-size:14px;color:var(--mut)}
.s11-tb h3{font-family:var(--f-head);font-size:clamp(22px,2vw,28px);line-height:1.25;display:flex;align-items:center;gap:8px}
.s11-tb h3 a::after{content:"";position:absolute;inset:0;border-radius:inherit}
.s11-tb h3 svg{width:18px;height:18px;color:var(--mut);transition:transform .4s var(--out)}
@media (hover:hover){.s11-tile:hover .s11-tb h3 svg{transform:translate(-3px,-3px);color:var(--acc)}}
.s11-tf{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:8px}
.s11-meta{font-size:15px;color:var(--mut);display:flex;gap:8px}
.s11-acts{position:relative;z-index:1;display:flex;gap:6px}
.rd .s11-acts a{display:inline-flex;align-items:center;height:40px;padding:0 16px;border-radius:999px;font-size:15.5px;font-weight:600;border:1px solid var(--glass-line);color:var(--ink)}
.rd .s11-acts a.b{background:var(--acc);border-color:var(--acc);color:#FFFBF7}
@media (max-width:899px){.s11-grid{display:none}}
.s11-pick{display:none}
@media (max-width:899px){
  .s11-pick{display:grid;gap:14px}
  .s11-pick .s11-tile{grid-column:auto}
  .s11-pick [data-panel][hidden]{display:none}
  .s11-keys{order:-1;display:flex;gap:8px;overflow-x:auto;scrollbar-width:none;padding:2px var(--gut) 6px;margin-inline:calc(-1 * var(--gut));scroll-snap-type:x proximity}
  .s11-keys::-webkit-scrollbar{display:none}
  .rd .s11-key{flex:none;display:grid;justify-items:center;gap:6px;width:78px;padding:6px;border-radius:18px;scroll-snap-align:start;color:var(--mut);font-size:14px;border:1px solid transparent;transition:border-color .3s,background-color .3s,color .3s}
  .s11-key img{width:100%;aspect-ratio:1;object-fit:cover;object-position:top;border-radius:12px}
  .s11-key[aria-selected="true"]{border-color:var(--acc);background:var(--glass);color:var(--ink)}
  .s11-pick .s11-acts{flex:1;justify-content:flex-end}
  .s11-pick .s11-tf{flex-wrap:wrap}
}
.s11-floor{border-radius:32px;padding:clamp(24px,4vw,52px);display:grid;gap:32px}
@media (min-width:960px){.s11-floor{grid-template-columns:minmax(0,.8fr) minmax(0,1.2fr);align-items:center;gap:56px}}
.s11-floor .say{display:grid;gap:14px;justify-items:start}
.s11-facts{display:grid;gap:12px}
@media (min-width:640px){.s11-facts{grid-template-columns:1fr 1fr}}
.s11-fact{border-radius:20px;padding:20px;display:grid;gap:6px;background:var(--card);box-shadow:0 0 0 1px var(--line)}
.rd[data-mode="dark"] .s11-fact{background:rgba(244,239,230,.03)}
.s11-fact h3{font-family:var(--f-head);font-size:22px;display:flex;align-items:center;gap:10px}
.s11-fact h3 i{width:8px;height:8px;background:var(--acc);transform:rotate(45deg);border-radius:1px}
.s11-fact p{color:var(--mut);font-size:16.5px}

/* contact page */
.s11-ch1{font-size:clamp(46px,7.4vw,96px);line-height:1.1}
.s11-ch1 em{font-style:normal;color:var(--acc-ink)}
.s11-promise{display:inline-flex;align-items:center;gap:8px;font-size:16px;color:var(--ink2)}
.s11-promise svg{width:16px;height:16px;color:var(--acc)}
.s11-cg{display:grid;gap:22px;align-items:start}
@media (min-width:960px){.s11-cg{grid-template-columns:minmax(0,1.35fr) minmax(0,.85fr)}}
.s11-cmain{display:grid;gap:14px}
.s11-chs{display:grid;gap:8px}
@media (min-width:700px){.s11-chs{grid-template-columns:repeat(3,1fr)}}
.s11-chr{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:12px;border-radius:20px;padding:14px 16px;transition:transform .4s var(--out),border-color .3s}
@media (hover:hover){.s11-chr:hover{transform:translateY(-3px);border-color:color-mix(in srgb,var(--acc) 50%,transparent)}}
.s11-chr .ic{width:40px;height:40px;border-radius:12px;display:grid;place-items:center;background:var(--acc-soft);color:var(--acc-ink)}
.s11-chr .ic svg{width:18px;height:18px}
.s11-chr .t{display:grid;line-height:1.35;min-width:0}
.s11-chr .t small{font-size:14px;color:var(--mut)}
.s11-chr .t b{text-align:right;font-weight:600;font-size:16.5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.s11-chr>svg{width:16px;height:16px;color:var(--mut)}
@media (min-width:700px){.s11-chr{grid-template-columns:auto 1fr;row-gap:14px;padding:16px}.s11-chr>svg{grid-row:1;grid-column:2;justify-self:end;align-self:start}.s11-chr .t{grid-column:1/-1}}
.s11-note{color:var(--mut);font-size:15.5px;padding-inline:4px}
.s11-form{border-radius:28px;padding:clamp(20px,3vw,32px);display:grid;gap:18px}
.s11-form .q{font-family:var(--f-head);font-size:22px}
.s11-topics{display:flex;flex-wrap:wrap;gap:8px}
.rd .s11-topic{display:inline-flex;align-items:center;gap:7px;height:42px;padding:0 16px;border-radius:999px;font-size:16px;color:var(--ink2);border:1px solid var(--glass-line);transition:background-color .3s,color .3s,border-color .3s}
.s11-topic svg{width:15px;height:15px}
.s11-topic[aria-checked="true"]{background:var(--ink);color:var(--bg);border-color:var(--ink)}
.s11-hand{display:none;gap:10px;align-items:start;padding:12px 14px;border-radius:16px;background:var(--acc-soft);font-size:15.5px;color:var(--ink2)}
.s11-hand a{color:var(--acc-ink);border-bottom:1px solid currentColor}
.s11-form[data-topic="review"] .s11-hand{display:flex}
.s11-pair{display:grid;gap:14px}
@media (min-width:640px){.s11-pair{grid-template-columns:1fr 1fr}}
.s11-f{display:grid;gap:6px}
.s11-f label{font-size:15px;color:var(--ink2);display:flex;justify-content:space-between}
.s11-f label small{color:var(--mut)}
.s11-in{width:100%;font:inherit;font-size:17px;color:var(--ink);background:color-mix(in srgb,var(--card) 70%,transparent);border:1px solid var(--line2);border-radius:14px;padding:12px 14px;outline:none;transition:border-color .3s,box-shadow .3s}
.s11-in:focus{border-color:var(--acc);box-shadow:0 0 0 4px var(--acc-soft)}
.s11-in::placeholder{color:var(--mut2)}
textarea.s11-in{min-height:150px;resize:vertical;line-height:1.7}
.s11-count{display:flex;justify-content:space-between;font-size:13.5px;color:var(--mut)}
.s11-err{color:#D6452A;font-size:15px;min-height:1px}
.s11-go{display:flex;flex-wrap:wrap;align-items:center;gap:12px}
.rd .s11-send{display:inline-flex;align-items:center;gap:8px;height:50px;padding:0 24px;border-radius:999px;background:var(--acc);color:#FFFBF7;font-weight:600;font-size:17px;border:0;cursor:pointer;font-family:inherit}
.s11-send svg{width:16px;height:16px}
.rd .s11-review-go{display:none}
.rd .s11-form[data-topic="review"] .s11-send{display:none}
.rd .s11-form[data-topic="review"] .s11-review-go{display:inline-flex}
.s11-fm{display:grid;gap:16px}
.s11-done{display:none;gap:14px}
.s11-form.sent>*:not(.s11-done){display:none!important}
.s11-form.sent .s11-done{display:grid}
.s11-done h2{font-family:var(--f-head);font-size:30px}
.s11-done dl{display:grid;grid-template-columns:auto 1fr;gap:6px 16px;margin:0;font-size:16px}
.s11-done dt{color:var(--mut)}
.s11-done dd{margin:0;white-space:pre-wrap;word-break:break-word}
.rd .s11-again{justify-self:start;font-size:16px;color:var(--acc-ink);border-bottom:1px solid currentColor;background:none;padding:0;cursor:pointer;font-family:inherit}
.s11-aside{display:grid;gap:14px}
.s11-card2{border-radius:24px;padding:20px;display:grid;gap:12px}
.s11-card2 .hd{display:flex;align-items:center;gap:8px;font-weight:600;font-size:16.5px}
.s11-card2 .hd svg{width:16px;height:16px;color:var(--acc)}
.s11-owner{display:flex;align-items:center;gap:12px;padding:10px;border-radius:16px;background:var(--card2)}
.s11-owner b{width:36px;height:36px;border-radius:10px;display:grid;place-items:center;background:var(--ink);color:var(--bg);font-family:var(--f-head)}
.s11-owner span{display:grid;line-height:1.35}
.s11-owner small{font-size:13.5px;color:var(--mut)}
.s11-reg{display:grid;grid-template-columns:auto 1fr;gap:8px 14px;margin:0;font-size:15px}
.s11-reg dt{color:var(--mut)}
.s11-reg dd{margin:0}
.s11-card2 p{color:var(--mut);font-size:15px}
.s11-cfoot{text-align:center;color:var(--mut);font-size:15.5px;margin-top:28px}

@media (max-width:767px){.s11-band{clip-path:inset(0 calc((1 - var(--p,1)) * 22%) 0 calc((1 - var(--p,1)) * 22%) round calc(28px + (1 - var(--p,1)) * 56px))}}
@media (prefers-reduced-motion:reduce){.s11-band{clip-path:none}.s11-dc{transition:none}}
.rd.shot .s11-band{clip-path:none}
`

/* while the band is under the header pill, the pill takes the band's colours */
const ONBAND = `(function(){var root=document.currentScript.parentElement,b=root.querySelector('.s11-band'),h=root.querySelector('.h-in');if(!b||!h)return;var io;
function build(){if(io)io.disconnect();var r=h.getBoundingClientRect();io=new IntersectionObserver(function(es){es.forEach(function(e){root.classList.toggle('onband',e.isIntersecting)})},{rootMargin:-Math.round(r.top+r.height/2)+'px 0px '+-Math.round(innerHeight-r.top-r.height/2-1)+'px 0px',threshold:0});io.observe(b)}
build();addEventListener('resize',build)})()`

/* the contact form, for the sample: no request leaves the page */
const FORM = `(function(){var f=document.currentScript.parentElement.querySelector('[data-contact]');if(!f)return;
var ts=[].slice.call(f.querySelectorAll('[data-topic-id]')),ta=f.querySelector('textarea'),em=f.querySelector('input[type=email]'),err=f.querySelector('.s11-err'),cnt=f.querySelector('[data-count]'),ph=JSON.parse(f.getAttribute('data-ph')),dn=JSON.parse(f.getAttribute('data-done')),cur='support';
function pick(id){cur=id;f.setAttribute('data-topic',id);ts.forEach(function(t){t.setAttribute('aria-checked',String(t.getAttribute('data-topic-id')===id))});ta.placeholder=ph[id]||ph.other}
ts.forEach(function(t){t.addEventListener('click',function(){pick(t.getAttribute('data-topic-id'))})});
ta.addEventListener('input',function(){cnt.textContent=ta.value.length+' / 8000'});
f.querySelector('form').addEventListener('submit',function(e){e.preventDefault();var m=ta.value.trim(),a=em.value.trim();
  if(!/^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$/.test(a)){err.textContent='يرجى إدخال بريد إلكتروني صالح.';em.focus();return}
  if(m.length<5){err.textContent='يرجى كتابة رسالتك، خمسة أحرف على الأقل.';ta.focus();return}
  err.textContent='';f.querySelector('[data-o=topic]').textContent=ts.filter(function(t){return t.getAttribute('aria-checked')==='true'})[0].textContent.trim();
  f.querySelector('[data-o=mail]').textContent=a;f.querySelector('[data-o=msg]').textContent=m;f.querySelector('[data-o=done]').textContent=dn[cur]||'';f.classList.add('sent')});
f.querySelector('.s11-again').addEventListener('click',function(){f.classList.remove('sent');ta.value='';cnt.textContent='0 / 8000'});
pick('support')})()`

function Faq({ list = FAQS }: { list?: ReadonlyArray<{ q: string; a: string }> }) {
  return (
    <div className="s1-faq">
      {list.map((f, i) => (
        <details key={f.q} className="glass" data-r style={{ ['--i' as string]: i % 3 }}>
          <summary>{f.q}<Plus size={22} strokeWidth={1.6} /></summary>
          <p>{f.a}</p>
        </details>
      ))}
    </div>
  )
}

function Sky() {
  return <div className="s1-sky s11-sky" aria-hidden><i className="b1" /><i className="b2" /><i className="b3" /></div>
}

function Footer() {
  return (
    <footer className="s1-foot">
      <div className="s1-fmark" data-vis aria-hidden><MarkDots /></div>
      <div className="s1-fline" />
      <div className="s1-fbody">
        <div className="wrap">
          <div className="s1-fgrid">
            <div className="s1-fbrand">
              <a href="/" aria-label="بينون"><MarkDots /></a>
              <p>{FOOTER.claim}</p>
              <a className="btn btn-ink" href="/templates" style={{ justifySelf: 'start' }}>ابدأ الإنشاء</a>
              <Contact />
            </div>
            <FooterLinks />
          </div>
          <div className="s1-fbase">
            <span>© {FOOTER.year} بينون. جميع الحقوق محفوظة.</span>
            <Socials />
          </div>
        </div>
      </div>
    </footer>
  )
}

function HeroA() {
  return (
    <section className="s11-hero">
      <Sky />
      <div className="wrap s11-hg">
        <div className="s11-htxt">
          <p className="s1-claim glass s11-fade" style={{ ['--d' as string]: '.05s' }}><b aria-hidden />{HERO.claim}</p>
          <h1 className="head s11-h1">{HERO.words.map((w, i) => <span key={w} style={{ ['--i' as string]: i }}>{w}{i < 2 ? '،' : '.'}</span>)}</h1>
          <p className="lead s11-fade">{HERO.sub}</p>
          <div className="s11-ctas s11-fade" style={{ ['--d' as string]: '.7s' }}>
            <a className="btn btn-white" href={HERO.primary.href}>{HERO.primary.label}</a>
            <a className="btn btn-line glass" href={HERO.secondary.href}>{HERO.secondary.label}</a>
          </div>
        </div>
        <div className="s11-stack s11-fade" data-tilt style={{ ['--d' as string]: '.85s' }}>
          <div className="s11-ly a"><Laptop><Vid v={DASH_D} kind="d" className="only-d" label="جولة في لوحة تحكم بينون" /></Laptop></div>
          <div className="s11-ly c"><div className="s11-chip glass"><img src={wideShot('restaurant')} alt="قالب موقع مطعم" /><p>موقع مطعم<span>قالب</span></p></div></div>
          <div className="s11-ly b"><Phone><Vid v={DASH_M} kind="m" label="لوحة تحكم بينون على الهاتف" /></Phone></div>
        </div>
      </div>
    </section>
  )
}

function HeroB() {
  return (
    <section className="s11-hb">
      <Sky />
      <div className="s1-ghost" aria-hidden><MarkDots /></div>
      <div className="wrap s1-hero-in">
        <p className="s1-claim glass s11-fade" style={{ ['--d' as string]: '.05s' }}><b aria-hidden />{HERO.claim}</p>
        <h1 className="head s11-h1 s11-h1b">{HERO.words.map((w, i) => <span key={w} style={{ ['--i' as string]: i }}>{w}.</span>)}</h1>
        <p className="lead s11-fade">{HERO.sub}</p>
        <div className="s11-ctas s11-fade" style={{ ['--d' as string]: '.7s', justifyContent: 'center' }}>
          <a className="btn btn-white" href={HERO.primary.href}>{HERO.primary.label}</a>
          <a className="btn btn-line glass" href={HERO.secondary.href}>{HERO.secondary.label}</a>
        </div>
      </div>
    </section>
  )
}

function Page({ hero }: { hero: 'a' | 'b' }) {
  const row = [...REVIEWS, ...REVIEWS]
  return (
    <Root id="s1 s11" mode="dark" css={S1_CSS + CSS}>
      <Header dots />
      {hero === 'a' ? <HeroA /> : <HeroB />}

      <section className="s1-sec">
        <div className="wrap s1-hd" data-r>
          <h2 className="head s1-title">{SECTIONS.reviews}</h2>
        </div>
        <div className="s1-rows" data-r>
          {[0, 1].map((r) => (
            <div key={r} className={'s1-row' + (r ? ' rev' : '')}>
              {[...row, ...row].map((rv, i) => (
                <figure key={i} className="s1-rv glass" aria-hidden={i >= REVIEWS.length || r === 1 ? true : undefined}>
                  <Stars n={rv.rating} />
                  <blockquote>«{rv.body}»</blockquote>
                  <figcaption><span>{rv.name}</span><span className="tag">بانتظار موافقتك</span></figcaption>
                </figure>
              ))}
            </div>
          ))}
        </div>
        <div className="wrap"><p className="note s1-revnote">{REVIEWS_NOTE}</p></div>
      </section>

      <section className="s11-bandsec">
        <div className="s11-band" data-p="enter">
          <div className="wrap">
            <div className="s11-bhd" data-r>
              <h2 className="head s1-title">{SECTIONS.dash}</h2>
              <p className="lead">{SECTIONS.dashLead}</p>
            </div>
            <div className="s11-sc" data-scrolly data-zone-m="-68% 0px -30% 0px" data-zone-d="-48% 0px -48% 0px">
              <div className="s11-media">
                <div className="s11-dev only-d">
                  <Laptop><Vid v={DASH_D} kind="d" seg={DASH_FEATURES[0].d} label="جولة في لوحة تحكم بينون" /></Laptop>
                  <div className="s11-mini"><Phone><Vid v={DASH_M} kind="m" seg={DASH_FEATURES[0].m} label="لوحة تحكم بينون على الهاتف" /></Phone></div>
                </div>
                <div className="s11-devm only-m"><Phone><Vid v={DASH_M} kind="m" seg={DASH_FEATURES[0].m} label="لوحة تحكم بينون على الهاتف" /></Phone></div>
              </div>
              <ol className="s11-blocks">
                {DASH_FEATURES.map((f, i) => {
                  const I = FEAT_ICONS[i]
                  return (
                    <li key={f.id} className="s11-block" data-block data-d={f.d.join(',')} data-m={f.m.join(',')}>
                      <span className="n">{AR[i]}</span>
                      <h3><I strokeWidth={1.7} aria-hidden />{f.title}</h3>
                      <p>{f.body}</p>
                    </li>
                  )
                })}
              </ol>
            </div>
          </div>
        </div>
      </section>

      <section className="s11-sec">
        <div className="wrap">
          <div className="s1-hd" data-r>
            <h2 className="head s1-title">{SECTIONS.edit}</h2>
            <p className="lead">{SECTIONS.editLead}</p>
          </div>
          <div className="s11-ew" data-sync>
            <Browser className="only-d" url="beynoun.com/editor"><Vid v={EDIT_D} kind="d" label="تعديل موقع في محرر بينون" /></Browser>
            <Phone className="only-m"><Vid v={EDIT_M} kind="m" label="تعديل موقع من الهاتف" /></Phone>
            <ol className="s11-chips">
              {EDIT_STEPS.map((s, i) => <li key={s.id} className="s11-chip2 glass" data-step data-d={s.d} data-m={s.m}><i>{NUM[i]}</i><b>{s.title}</b><span>{s.body}</span></li>)}
            </ol>
          </div>
        </div>
      </section>

      <section className="s11-sec" style={{ paddingTop: 24 }}>
        <div className="wrap">
          <div className="s1-hd" data-r>
            <h2 className="head s1-title">{SECTIONS.tpl}</h2>
            <p className="lead">{SECTIONS.tplLead}</p>
          </div>
          <div className="s11-strips" data-rotate="3800">
            {TEMPLATES.map((t) => {
              const meta = TEMPLATE_META.find((m) => m.id === t.id)
              return (
                <div key={t.id} className="s11-strip" data-item data-dot>
                  <picture><source media="(max-width:767px)" srcSet={phoneShot(t.id)} /><img src={bigShot(t.id)} alt={t.name} loading="lazy" /></picture>
                  {'soon' in t && t.soon ? <em>قريبًا</em> : null}
                  <span className="lab">{meta ? meta.label : t.name}</span>
                  <div className="cap"><span><strong>{t.name}</strong><small>{t.tag}</small></span><a href={t.href}>عرض القالب<Arrow /></a></div>
                </div>
              )
            })}
          </div>
          <div className="s11-tpfoot"><a className="btn btn-line glass" href="/templates">كل القوالب</a></div>
        </div>
      </section>

      <section className="s1-sec">
        <div className="wrap">
          <div className="s1-hd" data-r><h2 className="head s1-title">{SECTIONS.faq}</h2></div>
          <Faq />
          <div className="s1-more"><a className="btn btn-line glass" href="/faq">كل الأسئلة</a></div>
        </div>
      </section>
      <Footer />
      <script dangerouslySetInnerHTML={{ __html: ONBAND }} />
    </Root>
  )
}

export function Home() { return <Page hero="a" /> }
export function HomeB() { return <Page hero="b" /> }

export function Pricing() {
  const order = DISCOUNTS.cards
  const pos = (id: string) => (id === 'review' ? 1 : id === 'free-domain' ? 0 : 2)
  return (
    <Root id="s1 s11" mode="dark" css={S1_CSS + CSS}>
      <Header dots />
      <section className="s1-pr">
        <Sky />
        <div className="s1-prword" aria-hidden>الأسعار</div>
        <div className="wrap">
          <div className="s1-prhd">
            <h1 className="head s1-title">{PRICING_HEAD.l1}<br />{PRICING_HEAD.l2}</h1>
            <p className="lead">{PRICING_HEAD.sub}</p>
          </div>
          <div className="s1-cards">
            <div className="s11-orbs" aria-hidden><i className="o1" /><i className="o2" /><i className="o3" /></div>
            {PLANS.map((p, i) => (
              <article key={p.id} className={'s1-card glass' + (p.id === 'starter' ? ' hi' : '')} data-r style={{ ['--i' as string]: i }}>
                <p className="nm"><span>{p.name}</span>{'badge' in p && p.badge ? <span className="badge">{p.badge}</span> : null}</p>
                <p className="amt"><span className="ltr">{p.amount}</span><small>{p.per}</small></p>
                <p className="sub">{p.sub}</p>
                <ul>{p.features.map((f) => <li key={f}><Check strokeWidth={2.4} />{f}</li>)}</ul>
                <a className="btn" href={p.href}>{p.cta}</a>
                <p className="ft">{p.foot}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="s11-sec">
        <div className="wrap">
          <div className="s1-hd" data-r>
            <h2 className="head s1-title">{DISCOUNTS.head}</h2>
            <p className="lead">{DISCOUNTS.sub}</p>
          </div>
          <div data-rotate="4500">
            <div className="s11-fan" data-vis>
              {order.map((c) => {
                const p = pos(c.id)
                return (
                  <article key={c.id} className="s11-dc glass" data-item data-kind={c.kind}
                    style={{ ['--pos' as string]: p, ['--ad' as string]: Math.abs(p - 1), ['--z' as string]: 3 - Math.abs(p - 1) }}>
                    <span className="chip">{c.chip}</span>
                    <p className="fig ltr-num">{c.figure}</p>
                    <p className="fsub">{c.figureSub}</p>
                    <p className="body">{c.body}</p>
                    {'cta' in c && c.cta ? <a className="go" href={c.cta.href}>{c.cta.label}<Arrow /></a> : null}
                  </article>
                )
              })}
            </div>
            <div className="s11-pips">{order.map((c) => <button key={c.id} type="button" data-dot aria-label={c.figure + ' ' + c.figureSub} />)}</div>
          </div>
          <p className="s11-ffoot">{DISCOUNTS.foot}</p>
        </div>
      </section>

      <section className="s11-sec" style={{ paddingTop: 24 }}>
        <div className="wrap">
          <div className="s1-hd" data-r>
            <h2 className="head s1-title">{WHY.head}</h2>
            <p className="lead">{WHY.sub}</p>
          </div>
          <div className="s11-why glass" data-r>
            <table className="s11-tbl">
              <caption className="sr">مقارنة بينون بمنشئات المواقع الآلية العامة وبالوكالات</caption>
              <thead><tr><th scope="col">الميزة</th><th scope="col" className="z"><MarkDots /><span className="sr">بينون</span></th><th scope="col">{WHY.cols[1]}</th><th scope="col">{WHY.cols[2]}</th></tr></thead>
              <tbody>
                {COMPARE.map((r) => (
                  <tr key={r.feature}>
                    <th scope="row">{r.feature}</th>
                    <td className="z" data-label={WHY.cols[0]}><Check strokeWidth={2.4} aria-hidden />{r.zenya}</td>
                    <td data-label={WHY.cols[1]}>{r.other}</td>
                    <td data-label={WHY.cols[2]}>{r.agency}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="s1-sec" style={{ paddingTop: 24 }}>
        <div className="wrap">
          <div className="s1-hd" data-r><h2 className="head s1-title">أسئلة عن الأسعار</h2></div>
          <Faq list={PRICING_FAQS} />
        </div>
      </section>
      <Footer />
    </Root>
  )
}

function Tile({ t, lead }: { t: (typeof TEMPLATE_META)[number]; lead?: boolean }) {
  const soon = 'soon' in t && t.soon
  return (
    <article className={'s11-tile glass' + (lead ? ' big' : '')} data-r>
      <div className="s11-shot">
        <img src={bigShot(t.id)} alt={soon ? '' : 'معاينة قالب ' + t.name} loading="lazy" className={soon ? 's11-blur' : undefined} />
        {soon ? <span className="s11-veil"><span>قريبًا</span></span> : <span className="ph" aria-hidden><img src={phoneShot(t.id)} alt="" loading="lazy" /></span>}
      </div>
      <div className="s11-tb">
        <p className="tag">{t.tag}</p>
        {soon ? <h3>{t.name}</h3> : <h3><a href={t.page}>{t.name}</a><Arrow aria-hidden /></h3>}
        {soon ? null : (
          <div className="s11-tf">
            <p className="s11-meta"><span>{t.sections} قسمًا</span><span aria-hidden>·</span><span>{t.presets} أنماط جاهزة</span></p>
            <span className="s11-acts"><a href={t.demo}>معاينة</a><a className="b" href={t.build}>ابنِ<span className="sr"> بقالب {t.label}</span></a></span>
          </div>
        )}
      </div>
    </article>
  )
}

export function Templates() {
  return (
    <Root id="s1 s11" mode="dark" css={S1_CSS + CSS}>
      <Header dots />
      <section className="s11-ph">
        <Sky />
        <div className="wrap s11-phg">
          <div className="s11-say">
            <h1 className="head s11-ph1 s11-fade" style={{ ['--d' as string]: '.05s' }}>{TEMPLATES_HEAD.l1}<br /><span>{TEMPLATES_HEAD.l2}</span></h1>
            <p className="lead s11-fade" style={{ ['--d' as string]: '.2s' }}>{TEMPLATES_HEAD.sub}</p>
          </div>
          <div className="s11-tally glass s11-fade" style={{ ['--d' as string]: '.35s' }}>
            <p>في المجموع</p>
            <dl>
              <div><dt>قوالب</dt><dd>{TEMPLATE_TOTALS.templates}</dd></div>
              <div><dt>أقسام</dt><dd>{TEMPLATE_TOTALS.sections}</dd></div>
              <div><dt>أنماط جاهزة</dt><dd>{TEMPLATE_TOTALS.presets}</dd></div>
            </dl>
          </div>
        </div>
      </section>

      <section className="s11-sec" id="picker" style={{ paddingTop: 16 }}>
        <div className="wrap">
          <div className="s11-grid">{READY.map((t, i) => <Tile key={t.id} t={t} lead={i < 2} />)}</div>
          <div className="s11-pick" data-tabs>
            {READY.map((t, i) => <div key={t.id} data-panel={i} hidden={i > 0}><Tile t={t} /></div>)}
            <div className="s11-keys" role="tablist" aria-label="القوالب الثمانية">
              {READY.map((t, i) => (
                <button key={t.id} type="button" role="tab" className="s11-key" data-tab={i}>
                  <img src={wideShot(t.id)} alt="" loading="lazy" />{t.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="s11-sec" style={{ paddingTop: 24 }}>
        <div className="wrap">
          <div className="s11-floor glass" data-r>
            <div className="say">
              <h2 className="head s1-title">في كل قالب</h2>
              <p className="lead">الاختلاف في الشكل، لا في ما تحصل عليه.</p>
              <a className="btn btn-white" href="#picker">ابدأ الإنشاء</a>
            </div>
            <div className="s11-facts">
              {FLOOR.map((f) => <div key={f.head} className="s11-fact"><h3><i aria-hidden />{f.head}</h3><p>{f.body}</p></div>)}
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </Root>
  )
}

export function ContactPage() {
  const ph = { support: CONTACT.placeholders.other, request: CONTACT.placeholders.request, sales: CONTACT.placeholders.sales, review: CONTACT.placeholders.other, other: CONTACT.placeholders.other }
  const done = Object.fromEntries(CONTACT.topics.map((t) => [t.id, t.done]))
  return (
    <Root id="s1 s11" mode="dark" css={S1_CSS + CSS}>
      <Header dots />
      <section className="s11-ph">
        <Sky />
        <div className="wrap s11-say">
          <p className="s1-claim glass s11-fade" style={{ ['--d' as string]: '.05s' }}><b aria-hidden />{CONTACT.eyebrow}</p>
          <h1 className="head s11-ch1 s11-fade" style={{ ['--d' as string]: '.15s' }}>{CONTACT.h1a} <em>{CONTACT.h1b}</em>.</h1>
          <p className="lead s11-fade" style={{ ['--d' as string]: '.28s', maxWidth: '44ch' }}>{CONTACT.lede}</p>
          <p className="s11-promise s11-fade" style={{ ['--d' as string]: '.4s' }}><Clock aria-hidden />{CONTACT.promise}</p>
        </div>
      </section>

      <section className="s11-sec" style={{ paddingTop: 8 }}>
        <div className="wrap">
          <div className="s11-cg">
            <div className="s11-cmain">
              <div className="s11-chs" aria-label="طرق التواصل المباشر">
                <a className="s11-chr glass" href={'mailto:' + FOOTER.email}><span className="ic"><Mail aria-hidden /></span><span className="t"><small>البريد الإلكتروني</small><b className="ltr">{FOOTER.email}</b></span><Arrow aria-hidden /></a>
                <a className="s11-chr glass" href={FOOTER.phoneHref}><span className="ic"><PhoneIc aria-hidden /></span><span className="t"><small>الهاتف</small><b className="ltr">{FOOTER.phoneRead}</b></span><Arrow aria-hidden /></a>
                <a className="s11-chr glass" href="https://beynoun.com"><span className="ic"><Globe aria-hidden /></span><span className="t"><small>الموقع</small><b className="ltr">{CONTACT.site}</b></span><Arrow aria-hidden /></a>
              </div>
              <p className="s11-note">{CONTACT.chNote}</p>
              <div className="s11-form glass" data-contact data-topic="support" data-ph={JSON.stringify(ph)} data-done={JSON.stringify(done)}>
                <p className="q" id="s11-q">ما موضوع رسالتك؟</p>
                <div className="s11-topics" role="radiogroup" aria-labelledby="s11-q">
                  {CONTACT.topics.map((t, i) => {
                    const I = TOPIC_ICONS[i]
                    return <button key={t.id} type="button" role="radio" className="s11-topic" data-topic-id={t.id} aria-checked={i === 0}><I aria-hidden />{t.label}</button>
                  })}
                </div>
                <div className="s11-hand"><MessageSquareQuote size={16} aria-hidden /><p>{CONTACT.reviewHand} <a href="/review">قناة التقييم</a></p></div>
                <form className="s11-fm" noValidate>
                  <div className="s11-pair">
                    <div className="s11-f"><label htmlFor="s11-n">الاسم<small>اختياري</small></label><input id="s11-n" className="s11-in" type="text" autoComplete="name" maxLength={120} placeholder="كما تحبّ أن نناديك" /></div>
                    <div className="s11-f"><label htmlFor="s11-e">البريد الإلكتروني</label><input id="s11-e" className="s11-in ltr" type="email" dir="ltr" autoComplete="email" placeholder="name@company.com" /></div>
                  </div>
                  <div className="s11-f">
                    <label htmlFor="s11-m">الرسالة</label>
                    <textarea id="s11-m" className="s11-in" maxLength={CONTACT.maxMessage} placeholder={CONTACT.placeholders.other} />
                    <p className="s11-count"><span>يصلنا نصّك كما كتبته.</span><span dir="ltr" data-count>0 / {CONTACT.maxMessage}</span></p>
                  </div>
                  <p className="s11-err" role="status" aria-live="polite" />
                  <div className="s11-go">
                    <button type="submit" className="s11-send">أرسل الرسالة<Arrow aria-hidden /></button>
                    <a className="s11-send s11-review-go" href="/review">إلى قناة التقييم<Arrow aria-hidden /></a>
                  </div>
                </form>
                <div className="s11-done" role="status">
                  <h2>تمّ استلام رسالتك.</h2>
                  <p data-o="done" />
                  <dl><dt>الموضوع</dt><dd data-o="topic" /><dt>الردّ إلى</dt><dd data-o="mail" dir="ltr" style={{ textAlign: 'right' }} /><dt>رسالتك</dt><dd data-o="msg" /></dl>
                  <button type="button" className="s11-again">أرسل رسالة أخرى</button>
                </div>
              </div>
            </div>
            <aside className="s11-aside">
              <section className="s11-card2 glass" aria-labelledby="s11-reg">
                <p className="hd" id="s11-reg"><Building2 aria-hidden />الجهة التي تراسلها</p>
                <a className="s11-owner" href={CONTACT.ownerSite}><b>M</b><span><span className="ltr">{CONTACT.ownerLabel}</span><small>المالك الكامل لبينون</small></span></a>
                <dl className="s11-reg">{CONTACT.register.map(([k, v]) => <Fragment key={k}><dt>{k}</dt><dd>{v}</dd></Fragment>)}</dl>
                <p>{CONTACT.registerNote}</p>
              </section>
              <section className="s11-card2 glass" aria-labelledby="s11-soc">
                <p className="hd" id="s11-soc"><Globe aria-hidden />على المنصّات</p>
                <p>{CONTACT.socialNote}</p>
                <Socials />
              </section>
            </aside>
          </div>
          <p className="s11-cfoot">{CONTACT.footNote}</p>
        </div>
      </section>
      <Footer />
      <script dangerouslySetInnerHTML={{ __html: FORM }} />
    </Root>
  )
}
