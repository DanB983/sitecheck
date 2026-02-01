'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import styles from './Layout.module.css'

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  // Close menu on navigation
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileMenuOpen])

  // Close menu on ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false)
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [mobileMenuOpen])

  return (
    <div className={styles.layout}>
      <nav className={styles.navbar}>
        <div className={styles.navContainer}>
          <Link href="/" className={styles.logo}>
            SiteCheck
          </Link>
          
          {/* Desktop Navigation */}
          <div className={styles.navLinks}>
            <Link href="/" className={styles.navLink}>Home</Link>
            <Link href="/dashboard" className={styles.navLink}>Dashboard</Link>
            <Link href="/alerts" className={styles.navLink}>Alerts</Link>
            <Link href="/scan" className={styles.navLink}>Scan</Link>
            <Link href="/pricing" className={styles.navLink}>Pricing</Link>
            <Link href="/settings/branding" className={styles.navLink}>Branding</Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className={styles.mobileMenuButton}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={styles.mobileMenuOverlay}
                onClick={() => setMobileMenuOpen(false)}
              />
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'tween', duration: 0.2 }}
                className={styles.mobileMenu}
              >
                <nav className={styles.mobileNav}>
                  <Link href="/" className={styles.mobileNavLink}>
                    Home
                  </Link>
                  <Link href="/dashboard" className={styles.mobileNavLink}>
                    Dashboard
                  </Link>
                  <Link href="/alerts" className={styles.mobileNavLink}>
                    Alerts
                  </Link>
                  <Link href="/scan" className={styles.mobileNavLink}>
                    Scan
                  </Link>
                  <Link href="/pricing" className={styles.mobileNavLink}>
                    Pricing
                  </Link>
                  <Link href="/settings/branding" className={styles.mobileNavLink}>
                    Branding
                  </Link>
                </nav>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </nav>
      <main className={styles.main}>
        {children}
      </main>
    </div>
  )
}
