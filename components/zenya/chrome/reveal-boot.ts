/* The arrival boot. Inlined in the root layout's <head>, so it runs before the
   first paint and without waiting for any bundle.

   Every public view hides its arriving blocks under `.zy-js` and shows them
   once an IntersectionObserver marks them `data-in`. That class used to be
   added by each view on mount, which is after hydration: on a slow phone the
   finished page painted first, then vanished when the script landed, then
   faded in again. Setting the class here means the first paint is already
   the hidden half, and the observer below marks what is on screen as soon as
   the HTML is parsed, so the page fades in once, straight away. It waits two
   frames first: marked before the first paint, a block would skip its fade
   and simply be there.

   A browser with no script never gets the class and reads a finished page.
   One without IntersectionObserver is left without it too, since nothing
   could ever reveal what the class hides. The views keep their own
   observers: they cover client-side navigation, where this never runs. */
export const REVEAL_BOOT = `(function(){
if(!("IntersectionObserver" in window))return;
document.documentElement.classList.add("zy-js");
function go(){
var io=new IntersectionObserver(function(es){es.forEach(function(e){
if(!e.isIntersecting)return;e.target.setAttribute("data-in","true");io.unobserve(e.target);
});},{rootMargin:"0px 0px -8% 0px",threshold:0.08});
document.querySelectorAll("[data-reveal]").forEach(function(el){io.observe(el);});
}
function start(){requestAnimationFrame(function(){requestAnimationFrame(go);});}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start);else start();
})();`
