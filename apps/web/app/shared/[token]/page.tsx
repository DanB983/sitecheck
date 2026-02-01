'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import Layout from '@/components/Layout/Layout'
import Card from '@/components/ui/Card/Card'
import Button from '@/components/ui/Button/Button'
import Badge from '@/components/ui/Badge/Badge'
import SectionHeader from '@/components/ui/SectionHeader/SectionHeader'
import PageTransition from '@/components/ui/PageTransition/PageTransition'
import { AlertCircle, ArrowLeft } from 'lucide-react'
import styles from './page.module.css'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface Finding {
  id: number
  category: string
  severity: string
  title: string
  description: string
  recommendation: string | null
}

interface Scan {
  id: number
  url: string
  normalized_url: string | null
  final_url: string | null
  redirect_chain: string[] | null
  response_status: number | null
  overall_score: number | null
  risk_level: string | null
  created_at: string
  findings: Finding[]
}

type LoadingState = 'loading' | 'not_found' | 'expired' | 'error' | 'success'

export default function SharedReportPage() {
  const params = useParams()
  const router = useRouter()
  const token = params.token as string
  const [scan, setScan] = useState<Scan | null>(null)
  const [loadingState, setLoadingState] = useState<LoadingState>('loading')
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchSharedReport = async () => {
      try {
        setLoadingState('loading')
        const response = await fetch(`${API_BASE_URL}/shared/${token}`)
        
        if (response.status === 404) {
          setLoadingState('not_found')
          setError('This shared report link was not found.')
          return
        }
        
        if (response.status === 410) {
          setLoadingState('expired')
          setError('This report link has expired.')
          return
        }
        
        if (!response.ok) {
          throw new Error('Failed to load shared report')
        }
        
        const data = await response.json()
        setScan(data)
        setLoadingState('success')
      } catch (err) {
        setLoadingState('error')
        setError(err instanceof Error ? err.message : 'An unexpected error occurred')
        toast.error('Failed to load shared report')
      }
    }

    if (token) {
      fetchSharedReport()
    }
  }, [token])

  if (loadingState === 'loading') {
    return (
      <Layout>
        <PageTransition>
          <div className={styles.sharedReportPage}>
            <div className={styles.container}>
              <Card className={styles.loadingState}>
                <p>Loading shared report...</p>
              </Card>
            </div>
          </div>
        </PageTransition>
      </Layout>
    )
  }

  if (loadingState === 'not_found' || loadingState === 'expired' || loadingState === 'error') {
    return (
      <Layout>
        <PageTransition>
          <div className={styles.sharedReportPage}>
            <div className={styles.container}>
              <Card className={styles.errorState}>
                <AlertCircle size={48} className={styles.errorIcon} />
                <h2>{loadingState === 'expired' ? 'Link Expired' : loadingState === 'not_found' ? 'Report Not Found' : 'Error Loading Report'}</h2>
                <p>{error || 'An unexpected error occurred'}</p>
                {loadingState === 'expired' && (
                  <p className={styles.expiredMessage}>
                    This report link has expired. Please request a new share link from the report owner.
                  </p>
                )}
                <div className={styles.errorActions}>
                  <Link href="/scan">
                    <Button variant="primary">Request a New Report</Button>
                  </Link>
                  <Link href="/">
                    <Button variant="secondary">Go Home</Button>
                  </Link>
                </div>
              </Card>
            </div>
          </div>
        </PageTransition>
      </Layout>
    )
  }

  if (!scan) {
    return null
  }

  const displayUrl = scan.normalized_url || scan.url
  const hasDifferentFinalUrl = scan.final_url && scan.final_url !== displayUrl

  return (
    <Layout>
      <PageTransition>
        <div className={styles.sharedReportPage}>
          <div className={styles.container}>
            {/* Shared Report Banner */}
            <Card className={styles.sharedBanner}>
              <div className={styles.bannerContent}>
                <AlertCircle size={20} />
                <div>
                  <p className={styles.bannerTitle}>Shared Report (Read-Only)</p>
                  <p className={styles.bannerSubtitle}>This is a read-only view of a shared security report.</p>
                </div>
              </div>
            </Card>

            <SectionHeader
              title="Security & Compliance Report"
              subtitle={`Scanned on ${new Date(scan.created_at).toLocaleString()}`}
            />

            {/* Score Card */}
            <div className={styles.summaryRow}>
              <Card className={styles.scoreCard}>
                <p className={styles.scoreLabel}>Overall Security Score</p>
                <p className={styles.scoreValue}>{scan.overall_score ? Math.round(scan.overall_score) : 'N/A'}</p>
                {scan.risk_level && (
                  <Badge variant={scan.risk_level as any} className={styles.riskBadge}>
                    {scan.risk_level.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} Risk
                  </Badge>
                )}
              </Card>

              <Card className={styles.detailsCard}>
                <h3 className={styles.detailsTitle}>Scan Details</h3>
                <div className={styles.detailsGrid}>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>URL:</span>
                    <span className={styles.detailValue}>{displayUrl}</span>
                  </div>
                  {hasDifferentFinalUrl && (
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Final URL:</span>
                      <span className={styles.detailValue}>{scan.final_url}</span>
                    </div>
                  )}
                  {scan.response_status && (
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Status Code:</span>
                      <span className={styles.detailValue}>{scan.response_status}</span>
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {/* Findings */}
            <Card className={styles.findingsCard}>
              <h3 className={styles.findingsTitle}>Findings ({scan.findings.length} total)</h3>
              <div className={styles.findingsList}>
                {scan.findings.map((finding) => (
                  <div key={finding.id} className={styles.findingCard}>
                    <div className={styles.findingHeader}>
                      <Badge variant={finding.severity as any}>{finding.severity}</Badge>
                      <h4 className={styles.findingTitle}>{finding.title}</h4>
                    </div>
                    <p className={styles.findingDescription}>{finding.description}</p>
                    {finding.recommendation && (
                      <div className={styles.recommendationSection}>
                        <p className={styles.recommendationTitle}>Recommendation:</p>
                        <p className={styles.recommendation}>{finding.recommendation}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>

            {/* CTA */}
            <Card className={styles.ctaCard}>
              <h3>Want to create your own report?</h3>
              <p>Scan your website for free and get detailed security insights.</p>
              <Link href="/scan">
                <Button variant="primary">Scan My Website</Button>
              </Link>
            </Card>
          </div>
        </div>
      </PageTransition>
    </Layout>
  )
}

