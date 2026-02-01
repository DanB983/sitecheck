'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import Layout from '@/components/Layout/Layout'
import Card from '@/components/ui/Card/Card'
import Button from '@/components/ui/Button/Button'
import Input from '@/components/ui/Input/Input'
import SectionHeader from '@/components/ui/SectionHeader/SectionHeader'
import PageTransition from '@/components/ui/PageTransition/PageTransition'
import { FadeIn } from '@/components/ui/Motion/Motion'
import { Globe, Loader2 } from 'lucide-react'
import styles from './page.module.css'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const PROGRESS_STEPS = [
  'Normalising URL',
  'Checking HTTPS',
  'Checking headers',
  'Generating report'
]

export default function ScanPage() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [currentStep, setCurrentStep] = useState(0)
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const router = useRouter()

  useEffect(() => {
    if (loading) {
      let step = 0
      progressIntervalRef.current = setInterval(() => {
        step = (step + 1) % PROGRESS_STEPS.length
        setCurrentStep(step)
      }, 1500)
    } else {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
        progressIntervalRef.current = null
      }
      setCurrentStep(0)
    }

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
      }
    }
  }, [loading])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    setCurrentStep(0)

    const toastId = toast.loading('Starting scan...', {
      description: 'Preparing to scan your website'
    })

    try {
      const response = await fetch(`${API_BASE_URL}/scan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      })

      if (!response.ok) {
        let errorMessage = 'Failed to create scan'
        
        if (response.status === 503) {
          errorMessage = 'Database connection failed. Please ensure Docker and PostgreSQL are running.'
        } else {
          try {
            const data = await response.json()
            errorMessage = data.detail || errorMessage
          } catch {
            errorMessage = `Server error (${response.status}). Please try again later.`
          }
        }
        
        throw new Error(errorMessage)
      }

      const data = await response.json()
      toast.success('Scan completed!', {
        id: toastId,
        description: 'Redirecting to report...'
      })
      router.push(`/report/${data.scan_id}`)
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      toast.error('Scan failed', {
        id: toastId,
        description: errorMessage
      })
      setLoading(false)
    }
  }

  return (
    <Layout>
      <PageTransition>
        <div className={styles.scanPage}>
          <div className={styles.container}>
            <FadeIn>
              <Card className={styles.scanCard}>
              <SectionHeader
                title="Scan Your Website"
                subtitle="Enter a URL to scan for security and GDPR compliance issues"
              />
              <form onSubmit={handleSubmit} className={styles.form}>
                <Input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com"
                  disabled={loading}
                  error={error}
                  leftIcon={<Globe size={18} />}
                />
                <AnimatePresence>
                  {loading && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className={styles.progressContainer}
                    >
                      <div className={styles.progressSteps}>
                        {PROGRESS_STEPS.map((step, index) => (
                          <motion.div
                            key={index}
                            className={`${styles.progressStep} ${
                              index === currentStep ? styles.active : ''
                            } ${index < currentStep ? styles.completed : ''}`}
                            animate={{
                              opacity: index <= currentStep ? 1 : 0.5,
                              scale: index === currentStep ? 1.05 : 1
                            }}
                            transition={{ duration: 0.3 }}
                          >
                            <div className={styles.progressStepIndicator}>
                              {index < currentStep ? (
                                <motion.span
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className={styles.checkmark}
                                >
                                  ✓
                                </motion.span>
                              ) : index === currentStep ? (
                                <Loader2 size={16} className={styles.loadingIcon} />
                              ) : (
                                <span className={styles.stepNumber}>{index + 1}</span>
                              )}
                            </div>
                            <span className={styles.progressStepLabel}>{step}</span>
                          </motion.div>
                        ))}
                      </div>
                      <div className={styles.progressBar}>
                        <motion.div
                          className={styles.progressBarFill}
                          initial={{ width: 0 }}
                          animate={{ width: `${((currentStep + 1) / PROGRESS_STEPS.length) * 100}%` }}
                          transition={{ duration: 0.5, ease: 'easeOut' }}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={loading || !url.trim()}
                  className={styles.submitButton}
                >
                  {loading ? 'Scanning...' : 'Start Scan'}
                </Button>
              </form>
              </Card>
            </FadeIn>
          </div>
        </div>
        
        {/* Sticky CTA Bar - Mobile Only */}
        {!loading && (
          <div className={styles.stickyCTA}>
            <Link href="/scan">
              <Button variant="primary" className={styles.stickyCTAButton}>
                Scan my website
              </Button>
            </Link>
          </div>
        )}
      </PageTransition>
    </Layout>
  )
}
