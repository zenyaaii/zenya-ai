'use client'

/* Top scroll-progress rail — a thin brand-gradient bar that fills as the
 * visitor scrolls the page. A small premium touch on long marketing pages.
 * Anchored to the right under RTL so it "grows" the way Arabic reads. */

import { motion, useScroll, useSpring } from 'framer-motion'

export default function ScrollProgress() {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    restDelta: 0.001,
  })

  return (
    <motion.div
      aria-hidden
      className="fixed inset-x-0 top-0 z-[60] h-[2.5px] origin-right"
      style={{
        scaleX,
        background:
          'linear-gradient(90deg, #4f5ab8, #5e6ad2 40%, #7170ff 70%, #d97706)',
        boxShadow: '0 1px 8px rgba(94,106,210,0.45)',
      }}
    />
  )
}
