'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePathname } from 'next/navigation'

interface PageTransitionProps {
  children: React.ReactNode
}

export default function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname()
  const [isDesktop, setIsDesktop] = useState(false)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    
    // Check viewport width
    const checkViewport = () => {
      setIsDesktop(window.innerWidth >= 768)
    }
    
    // Check reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)
    
    checkViewport()
    window.addEventListener('resize', checkViewport)
    mediaQuery.addEventListener('change', (e) => setPrefersReducedMotion(e.matches))
    
    return () => {
      window.removeEventListener('resize', checkViewport)
      mediaQuery.removeEventListener('change', (e) => setPrefersReducedMotion(e.matches))
    }
  }, [])

  // On first render or mobile/reduced motion, render directly
  if (!mounted || !isDesktop || prefersReducedMotion) {
    return <>{children}</>
  }

  // Desktop with motion enabled
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{
          duration: 0.2,
          ease: [0.4, 0, 0.2, 1]
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}

