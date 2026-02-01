'use client'

import { useEffect, useState, useRef, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, useSpring, useTransform, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import Layout from '@/components/Layout/Layout'
import Card from '@/components/ui/Card/Card'
import Button from '@/components/ui/Button/Button'
import Badge from '@/components/ui/Badge/Badge'
import Input from '@/components/ui/Input/Input'
import SectionHeader from '@/components/ui/SectionHeader/SectionHeader'
import PageTransition from '@/components/ui/PageTransition/PageTransition'
import { FadeIn, Stagger } from '@/components/ui/Motion/Motion'
import SeverityChart from '@/components/ui/Chart/SeverityChart'
import Modal from '@/components/ui/Modal/Modal'
import { Filter, X, ChevronUp, Download, FileText, Share2, Copy, Check } from 'lucide-react'
import styles from './page.module.css'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface Finding {
  id: number
  category: 'security' | 'gdpr' | 'seo' | 'other'
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info'
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
  risk_level: 'critical' | 'high' | 'medium' | 'low' | 'info' | null
  findings: Finding[]
  created_at: string
}

type LoadingState = 'loading' | 'loaded' | 'not_found' | 'error'

const SEVERITY_ORDER = ['critical', 'high', 'medium', 'low', 'info'] as const
type SeverityType = typeof SEVERITY_ORDER[number]

interface AIExplanation {
  executive_summary: string
  top_risks: string[]
  quick_wins: string[]
  recommended_next_step: string
}

export default function ReportPage() {
  const params = useParams()
  const router = useRouter()
  const scanId = params.scanId as string
  const [scan, setScan] = useState<Scan | null>(null)
  const [loadingState, setLoadingState] = useState<LoadingState>('loading')
  const [error, setError] = useState('')
  const [expandedRecommendations, setExpandedRecommendations] = useState<Set<number>>(new Set())
  const [showRedirectChain, setShowRedirectChain] = useState(false)
  const [aiExplanation, setAiExplanation] = useState<AIExplanation | null>(null)
  const [loadingExplanation, setLoadingExplanation] = useState(false)
  const [explanationError, setExplanationError] = useState('')
  const hasAnimatedRef = useRef(false)
  
  // Filter states
  const [severityFilter, setSeverityFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [showBackToTop, setShowBackToTop] = useState(false)
  const [activeBrandId, setActiveBrandId] = useState<number | null>(null)
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [shareExpiresIn, setShareExpiresIn] = useState<number | null>(null)
  const [shareExpiryEnabled, setShareExpiryEnabled] = useState(false)
  const [copySuccess, setCopySuccess] = useState(false)
  const [creatingShare, setCreatingShare] = useState(false)

  useEffect(() => {
    const fetchScan = async () => {
      try {
        setLoadingState('loading')
        const response = await fetch(`${API_BASE_URL}/scan/${scanId}`)
        
        if (response.status === 404) {
          setLoadingState('not_found')
          toast.error('Scan not found', {
            description: 'The scan you\'re looking for doesn\'t exist or has been deleted.'
          })
          return
        }
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status} ${response.statusText}`)
        }
        
        const data = await response.json()
        setScan(data)
        setLoadingState('loaded')
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'An error occurred while fetching the scan'
        setError(errorMessage)
        setLoadingState('error')
        toast.error('Failed to load report', {
          description: errorMessage
        })
      }
    }

    if (scanId) {
      fetchScan()
    }
  }, [scanId])

  // Animate score count-up with Framer Motion
  const scoreSpring = useSpring(0, { stiffness: 50, damping: 30 })
  const displayScore = useTransform(scoreSpring, (latest) => Math.round(latest))

  useEffect(() => {
    if (scan && scan.overall_score !== null && !hasAnimatedRef.current) {
      hasAnimatedRef.current = true
      const targetScore = Math.round(scan.overall_score)
      scoreSpring.set(targetScore)
    }
  }, [scan, scoreSpring])

  // Back to top button visibility
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const toggleRecommendation = (findingId: number) => {
    setExpandedRecommendations(prev => {
      const next = new Set(prev)
      if (next.has(findingId)) {
        next.delete(findingId)
      } else {
        next.add(findingId)
      }
      return next
    })
  }

  const handleCreateShareLink = async () => {
    setCreatingShare(true)
    try {
      const response = await fetch(`${API_BASE_URL}/scan/${scanId}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          expires_in_hours: shareExpiryEnabled ? shareExpiresIn : null
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create share link')
      }

      const data = await response.json()
      setShareUrl(data.share_url)
      toast.success('Share link created!')
    } catch (error) {
      toast.error('Failed to create share link', {
        description: error instanceof Error ? error.message : 'An error occurred'
      })
    } finally {
      setCreatingShare(false)
    }
  }

  const handleCopyShareLink = async () => {
    if (!shareUrl) return
    
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopySuccess(true)
      toast.success('Share link copied to clipboard!')
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (error) {
      toast.error('Failed to copy link')
    }
  }

  const handleDownloadPDF = async (branded: boolean = false) => {
    try {
      let url = `${API_BASE_URL}/scan/${scanId}/pdf`
      const params = new URLSearchParams()
      
      if (branded) {
        if (!activeBrandId) {
          toast.info('Please create or select a brand profile first', {
            action: {
              label: 'Go to Settings',
              onClick: () => router.push('/settings/branding')
            }
          })
          router.push('/settings/branding')
          return
        }
        params.append('mode', 'branded')
        params.append('brand_id', activeBrandId.toString())
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`
      }

      const response = await fetch(url)
      
      if (response.status === 402) {
        toast.error('Branded PDFs are a premium feature', {
          description: 'Upgrade to unlock white-label reports',
          action: {
            label: 'View Pricing',
            onClick: () => router.push('/pricing?feature=branded_pdf')
          }
        })
        router.push('/pricing?feature=branded_pdf')
        return
      }

      if (!response.ok) {
        throw new Error('Failed to generate PDF')
      }

      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = downloadUrl
      
      // Get filename from Content-Disposition header or generate one
      const contentDisposition = response.headers.get('Content-Disposition')
      let filename = `sitecheck-report-${scanId}.pdf`
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/)
        if (filenameMatch) {
          filename = filenameMatch[1]
        }
      }
      
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(downloadUrl)
      
      toast.success(branded ? 'Branded PDF downloaded' : 'PDF downloaded')
    } catch (error) {
      toast.error('Failed to download PDF', {
        description: error instanceof Error ? error.message : 'An error occurred'
      })
    }
  }

  const generateAISummary = async () => {
    setLoadingExplanation(true)
    setExplanationError('')
    try {
      const response = await fetch(`${API_BASE_URL}/scan/${scanId}/explain`)
      if (!response.ok) {
        throw new Error('Failed to generate AI summary')
      }
      const data = await response.json()
      setAiExplanation(data)
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate AI summary'
      setExplanationError(errorMessage)
    } finally {
      setLoadingExplanation(false)
    }
  }

  // Calculate severity breakdown
  const severityCounts = useMemo(() => {
    if (!scan) return {}
    return scan.findings.reduce((acc, finding) => {
      acc[finding.severity] = (acc[finding.severity] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  }, [scan])

  // Get unique categories
  const categories = useMemo(() => {
    if (!scan) return []
    const uniqueCategories = new Set(scan.findings.map(f => f.category))
    return Array.from(uniqueCategories)
  }, [scan])

  // Filter and group findings
  const filteredAndGroupedFindings = useMemo(() => {
    if (!scan) return {}

    let filtered = scan.findings

    // Apply severity filter
    if (severityFilter !== 'all') {
      filtered = filtered.filter(f => f.severity === severityFilter)
    }

    // Apply category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(f => f.category === categoryFilter)
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(f => 
        f.title.toLowerCase().includes(query) || 
        f.description.toLowerCase().includes(query)
      )
    }

    // Group by category
    const grouped = filtered.reduce((acc, finding) => {
      if (!acc[finding.category]) {
        acc[finding.category] = []
      }
      acc[finding.category].push(finding)
      return acc
    }, {} as Record<string, Finding[]>)

    // Sort within each category by severity
    Object.keys(grouped).forEach(category => {
      grouped[category].sort((a, b) => {
        const aIndex = SEVERITY_ORDER.indexOf(a.severity)
        const bIndex = SEVERITY_ORDER.indexOf(b.severity)
        return aIndex - bIndex
      })
    })

    return grouped
  }, [scan, severityFilter, categoryFilter, searchQuery])

  const getScoreColor = (score: number | null) => {
    if (!score) return styles.scoreNeutral
    if (score >= 80) return styles.scoreGood
    if (score >= 50) return styles.scoreMedium
    return styles.scoreBad
  }

  const getSeverityBadgeVariant = (severity: SeverityType): 'critical' | 'high' | 'medium' | 'low' | 'info' => {
    return severity
  }

  // Prepare chart data
  const chartData = useMemo(() => {
    return SEVERITY_ORDER.map(severity => ({
      name: severity.charAt(0).toUpperCase() + severity.slice(1),
      value: severityCounts[severity] || 0,
      color: severity === 'critical' ? '#dc2626' :
             severity === 'high' ? '#ef4444' :
             severity === 'medium' ? '#f59e0b' :
             severity === 'low' ? '#2563eb' : '#64748b'
    }))
  }, [severityCounts])

  // Loading skeleton
  if (loadingState === 'loading') {
    return (
      <Layout>
        <PageTransition>
          <div className={styles.reportPage}>
          <div className={styles.container}>
            <div className={styles.summaryRow}>
              <Card className={styles.scoreCardSkeleton}>
                <div className={styles.skeletonLine} style={{ width: '60%', height: '20px', marginBottom: '16px' }} />
                <div className={styles.skeletonLine} style={{ width: '80px', height: '80px', borderRadius: '8px', margin: '0 auto 16px' }} />
                <div className={styles.skeletonLine} style={{ width: '100px', height: '24px', margin: '0 auto' }} />
              </Card>
              <Card className={styles.detailsCardSkeleton}>
                <div className={styles.skeletonLine} style={{ width: '40%', height: '20px', marginBottom: '16px' }} />
                <div className={styles.skeletonLine} style={{ width: '100%', height: '16px', marginBottom: '8px' }} />
                <div className={styles.skeletonLine} style={{ width: '80%', height: '16px', marginBottom: '8px' }} />
                <div className={styles.skeletonLine} style={{ width: '60%', height: '16px' }} />
              </Card>
            </div>
            <Card className={styles.breakdownSkeleton}>
              <div className={styles.skeletonLine} style={{ width: '30%', height: '20px', marginBottom: '16px' }} />
              <div style={{ display: 'flex', gap: '12px' }}>
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className={styles.skeletonLine} style={{ flex: 1, height: '60px', borderRadius: '8px' }} />
                ))}
              </div>
            </Card>
          </div>
        </div>
        </PageTransition>
      </Layout>
    )
  }

  if (loadingState === 'not_found') {
    return (
      <Layout>
        <PageTransition>
          <div className={styles.reportPage}>
          <div className={styles.container}>
            <Card className={styles.errorState}>
              <h2>Scan Not Found</h2>
              <p>The scan you're looking for doesn't exist or has been deleted.</p>
              <Link href="/scan">
                <Button variant="primary">Back to Scan</Button>
              </Link>
            </Card>
          </div>
        </div>
        </PageTransition>
      </Layout>
    )
  }

  if (loadingState === 'error' || !scan) {
    return (
      <Layout>
        <PageTransition>
          <div className={styles.reportPage}>
          <div className={styles.container}>
            <Card className={styles.errorState}>
              <h2>Error Loading Report</h2>
              <p>{error || 'An unexpected error occurred'}</p>
              <div className={styles.errorActions}>
                <Button variant="primary" onClick={() => window.location.reload()}>
                  Retry
                </Button>
                <Link href="/scan">
                  <Button variant="secondary">Back to Scan</Button>
                </Link>
              </div>
            </Card>
          </div>
        </div>
        </PageTransition>
      </Layout>
    )
  }

  const displayUrl = scan.normalized_url || scan.url
  const hasDifferentFinalUrl = scan.final_url && scan.final_url !== displayUrl

  return (
    <Layout>
      <div className={styles.reportPage}>
        <div className={styles.container}>
          <SectionHeader
            title="Security & Compliance Report"
            subtitle={`Scanned on ${new Date(scan.created_at).toLocaleString()}`}
            action={
              <div className={styles.actionButtons}>
                <Button 
                  variant="ghost" 
                  onClick={() => setShareModalOpen(true)}
                  className={styles.shareButton}
                >
                  <Share2 size={18} />
                  Share Report
                </Button>
                <div className={styles.downloadActions}>
                  <div className={styles.downloadButtons}>
                    <Button 
                      variant="secondary" 
                      onClick={() => handleDownloadPDF(false)}
                      className={styles.downloadButton}
                    >
                      <Download size={18} />
                      Download PDF
                    </Button>
                    <Button 
                      variant="primary" 
                      onClick={() => handleDownloadPDF(true)}
                      className={styles.downloadButton}
                    >
                      <FileText size={18} />
                      Branded PDF
                    </Button>
                  </div>
                  <p className={styles.downloadHint}>Best for sharing with clients or developers.</p>
                </div>
              </div>
            }
          />
          
          {/* Share Modal */}
          <Modal
            isOpen={shareModalOpen}
            onClose={() => {
              setShareModalOpen(false)
              setShareUrl(null)
              setShareExpiryEnabled(false)
              setShareExpiresIn(null)
            }}
            title="Share Report"
          >
            {!shareUrl ? (
              <div className={styles.shareModalContent}>
                <p className={styles.shareModalDescription}>
                  Create a shareable link to this report. Anyone with the link can view it.
                </p>
                
                <div className={styles.shareOptions}>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={shareExpiryEnabled}
                      onChange={(e) => {
                        setShareExpiryEnabled(e.target.checked)
                        if (e.target.checked && !shareExpiresIn) {
                          setShareExpiresIn(24)
                        }
                      }}
                      className={styles.checkbox}
                    />
                    <span>Set expiry</span>
                  </label>
                  
                  {shareExpiryEnabled && (
                    <select
                      value={shareExpiresIn || 24}
                      onChange={(e) => setShareExpiresIn(parseInt(e.target.value))}
                      className={styles.expirySelect}
                    >
                      <option value={24}>24 hours</option>
                      <option value={168}>7 days</option>
                      <option value={720}>30 days</option>
                    </select>
                  )}
                </div>
                
                <Button
                  variant="primary"
                  onClick={handleCreateShareLink}
                  disabled={creatingShare}
                  className={styles.generateButton}
                >
                  {creatingShare ? 'Generating...' : 'Generate Link'}
                </Button>
              </div>
            ) : (
              <div className={styles.shareModalContent}>
                <p className={styles.shareModalDescription}>
                  Share this link with anyone who needs access to the report:
                </p>
                
                <div className={styles.shareUrlContainer}>
                  <input
                    type="text"
                    value={shareUrl}
                    readOnly
                    className={styles.shareUrlInput}
                  />
                  <Button
                    variant="secondary"
                    onClick={handleCopyShareLink}
                    className={styles.copyButton}
                  >
                    {copySuccess ? (
                      <>
                        <Check size={18} />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy size={18} />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
                
                <p className={styles.shareHint}>
                  This link {shareExpiryEnabled ? `will expire in ${shareExpiresIn === 24 ? '24 hours' : shareExpiresIn === 168 ? '7 days' : '30 days'}` : 'does not expire'}.
                </p>
              </div>
            )}
          </Modal>

          {/* Top Summary Row */}
          <div className={styles.summaryRow}>
            {/* Score Card */}
            <Card className={styles.scoreCard}>
              <div className={styles.scoreLabel}>Overall Score</div>
              <motion.div 
                className={`${styles.scoreValue} ${getScoreColor(scan.overall_score)}`}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                {scan.overall_score !== null ? (
                  <motion.span>
                    {displayScore}
                  </motion.span>
                ) : 'N/A'}
              </motion.div>
              {scan.risk_level && (
                <div className={styles.riskBadgeContainer}>
                  <Badge variant={getSeverityBadgeVariant(scan.risk_level)}>
                    {scan.risk_level.charAt(0).toUpperCase() + scan.risk_level.slice(1)} Risk
                  </Badge>
                </div>
              )}
              <div className={styles.urlSection}>
                <div className={styles.urlLabel}>URL</div>
                <div className={styles.urlValue}>{displayUrl}</div>
                {hasDifferentFinalUrl && (
                  <div className={styles.finalUrlNote}>
                    Final: {scan.final_url}
                  </div>
                )}
              </div>
            </Card>

            {/* Scan Details Card */}
            <Card className={styles.detailsCard}>
              <h3 className={styles.detailsTitle}>Scan Details</h3>
              <div className={styles.detailsGrid}>
                {scan.response_status && (
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Status Code</span>
                    <span className={styles.detailValue}>{scan.response_status}</span>
                  </div>
                )}
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Created</span>
                  <span className={styles.detailValue}>
                    {new Date(scan.created_at).toLocaleDateString()}
                  </span>
                </div>
                {scan.redirect_chain && scan.redirect_chain.length > 1 && (
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Redirects</span>
                    <Button
                      variant="ghost"
                      onClick={() => setShowRedirectChain(!showRedirectChain)}
                      className={styles.redirectToggle}
                    >
                      {showRedirectChain ? '▼ Hide' : '▶ Show'} ({scan.redirect_chain.length} steps)
                    </Button>
                  </div>
                )}
              </div>
              {showRedirectChain && scan.redirect_chain && (
                <div className={styles.redirectChain}>
                  {scan.redirect_chain.map((url, index) => (
                    <div key={index} className={styles.redirectStep}>
                      <span className={styles.redirectNumber}>{index + 1}</span>
                      <span className={styles.redirectUrl}>{url}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Severity Breakdown */}
          <Card className={styles.breakdownCard}>
            <h3 className={styles.breakdownTitle}>Severity Breakdown</h3>
            <div className={styles.breakdownContent}>
              <div className={styles.severityTiles}>
                {SEVERITY_ORDER.map(severity => (
                  <div key={severity} className={styles.severityTile}>
                    <Badge variant={getSeverityBadgeVariant(severity)} className={styles.severityTileBadge}>
                      {severity}
                    </Badge>
                    <div className={styles.severityCount}>
                      {severityCounts[severity] || 0}
                    </div>
                  </div>
                ))}
              </div>
              <div className={styles.chartContainer}>
                <SeverityChart data={chartData} />
              </div>
            </div>
          </Card>

          {/* AI Summary Section */}
          {loadingExplanation && (
            <Card className={styles.aiSummaryCard}>
              <div className={styles.aiSummaryLoading}>
                <div className={styles.spinner}></div>
                <p>Generating AI-powered explanation...</p>
              </div>
            </Card>
          )}
          
          {explanationError && (
            <Card className={styles.aiSummaryCard}>
              <div className={styles.aiSummaryError}>
                <p>{explanationError}</p>
                <Button variant="primary" onClick={generateAISummary}>
                  Try Again
                </Button>
              </div>
            </Card>
          )}
          
          {aiExplanation && !loadingExplanation && (
            <Card className={styles.aiSummaryCard}>
              <SectionHeader
                title="AI Summary"
                action={
                  <Button
                    variant="ghost"
                    onClick={generateAISummary}
                    disabled={loadingExplanation}
                  >
                    🔄 Regenerate
                  </Button>
                }
              />
              <div className={styles.aiSummaryContent}>
                <div>
                  <h4 className={styles.aiSummarySubtitle}>Executive Summary</h4>
                  <p className={styles.aiSummaryText}>{aiExplanation.executive_summary}</p>
                </div>
                <div>
                  <h4 className={styles.aiSummarySubtitle}>Top 3 Risks</h4>
                  <ul className={styles.aiSummaryList}>
                    {aiExplanation.top_risks.map((risk, index) => (
                      <li key={index}>{risk}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className={styles.aiSummarySubtitle}>Quick Wins</h4>
                  <ul className={styles.aiSummaryList}>
                    {aiExplanation.quick_wins.map((win, index) => (
                      <li key={index}>{win}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className={styles.aiSummarySubtitle}>Recommended Next Step</h4>
                  <p className={styles.aiSummaryText}>{aiExplanation.recommended_next_step}</p>
                </div>
              </div>
            </Card>
          )}

          {/* Findings Section */}
          <div className={styles.findingsSection}>
            <SectionHeader
              title="Findings"
              subtitle={`${scan.findings.length} total finding${scan.findings.length !== 1 ? 's' : ''}`}
              action={
                !aiExplanation && (
                  <Button
                    variant="primary"
                    onClick={generateAISummary}
                    disabled={loadingExplanation}
                  >
                    {loadingExplanation ? 'Generating...' : '🤖 Generate AI Summary'}
                  </Button>
                )
              }
            />

            {/* Filters */}
            <div className={styles.filtersWrapper}>
              {/* Mobile: Collapsible Filter Button */}
              <div className={styles.filtersMobileHeader}>
                <Button
                  variant="secondary"
                  onClick={() => setFiltersOpen(!filtersOpen)}
                  className={styles.filtersToggle}
                >
                  <Filter size={18} />
                  Filters
                  {(severityFilter !== 'all' || categoryFilter !== 'all' || searchQuery.trim()) && (
                    <span className={styles.filterBadge}>
                      {[severityFilter !== 'all' ? 1 : 0, categoryFilter !== 'all' ? 1 : 0, searchQuery.trim() ? 1 : 0].reduce((a, b) => a + b, 0)}
                    </span>
                  )}
                </Button>
              </div>

              {/* Desktop: Always Visible */}
              <div className={styles.filtersDesktop}>
                <Card className={styles.filtersCard}>
                  <div className={styles.filtersRow}>
                    <div className={styles.filterGroup}>
                      <label className={styles.filterLabel}>Severity</label>
                      <select
                        className={styles.filterSelect}
                        value={severityFilter}
                        onChange={(e) => setSeverityFilter(e.target.value)}
                      >
                        <option value="all">All</option>
                        {SEVERITY_ORDER.map(severity => (
                          <option key={severity} value={severity}>
                            {severity.charAt(0).toUpperCase() + severity.slice(1)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className={styles.filterGroup}>
                      <label className={styles.filterLabel}>Category</label>
                      <select
                        className={styles.filterSelect}
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                      >
                        <option value="all">All</option>
                        {categories.map(category => (
                          <option key={category} value={category}>
                            {category.charAt(0).toUpperCase() + category.slice(1)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className={styles.filterGroup}>
                      <label className={styles.filterLabel}>Search</label>
                      <Input
                        type="text"
                        placeholder="Search findings..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={styles.searchInput}
                      />
                    </div>
                    {(severityFilter !== 'all' || categoryFilter !== 'all' || searchQuery.trim()) && (
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setSeverityFilter('all')
                          setCategoryFilter('all')
                          setSearchQuery('')
                        }}
                        className={styles.clearFilters}
                      >
                        Clear Filters
                      </Button>
                    )}
                  </div>
                </Card>
              </div>

              {/* Mobile: Collapsible Drawer */}
              <AnimatePresence>
                {filtersOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className={styles.filtersMobile}
                  >
                    <Card className={styles.filtersCard}>
                      <div className={styles.filtersMobileHeader}>
                        <h3 className={styles.filtersMobileTitle}>Filters</h3>
                        <Button
                          variant="ghost"
                          onClick={() => setFiltersOpen(false)}
                          className={styles.filtersClose}
                        >
                          <X size={20} />
                        </Button>
                      </div>
                      <div className={styles.filtersRowMobile}>
                        <div className={styles.filterGroup}>
                          <label className={styles.filterLabel}>Severity</label>
                          <select
                            className={styles.filterSelect}
                            value={severityFilter}
                            onChange={(e) => setSeverityFilter(e.target.value)}
                          >
                            <option value="all">All</option>
                            {SEVERITY_ORDER.map(severity => (
                              <option key={severity} value={severity}>
                                {severity.charAt(0).toUpperCase() + severity.slice(1)}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className={styles.filterGroup}>
                          <label className={styles.filterLabel}>Category</label>
                          <select
                            className={styles.filterSelect}
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                          >
                            <option value="all">All</option>
                            {categories.map(category => (
                              <option key={category} value={category}>
                                {category.charAt(0).toUpperCase() + category.slice(1)}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className={styles.filterGroup}>
                          <label className={styles.filterLabel}>Search</label>
                          <Input
                            type="text"
                            placeholder="Search findings..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={styles.searchInput}
                          />
                        </div>
                        {(severityFilter !== 'all' || categoryFilter !== 'all' || searchQuery.trim()) && (
                          <Button
                            variant="ghost"
                            onClick={() => {
                              setSeverityFilter('all')
                              setCategoryFilter('all')
                              setSearchQuery('')
                            }}
                            className={styles.clearFilters}
                          >
                            Clear Filters
                          </Button>
                        )}
                      </div>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Findings List */}
            {Object.keys(filteredAndGroupedFindings).length === 0 ? (
              <Card className={styles.noFindings}>
                <p>No findings match your filters.</p>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setSeverityFilter('all')
                    setCategoryFilter('all')
                    setSearchQuery('')
                  }}
                >
                  Clear Filters
                </Button>
              </Card>
            ) : (
              <Stagger>
                {Object.entries(filteredAndGroupedFindings).map(([category, findings]) => (
                  <div key={category} className={styles.categoryGroup}>
                    <h3 className={styles.categoryTitle}>
                      {category.charAt(0).toUpperCase() + category.slice(1)} ({findings.length})
                    </h3>
                    <Stagger className={styles.findingsList} staggerDelay={0.05}>
                      {findings.map((finding) => (
                        <Card key={finding.id} className={styles.findingCard} interactive>
                          <div className={styles.findingHeader}>
                            <Badge variant={getSeverityBadgeVariant(finding.severity)}>
                              {finding.severity}
                            </Badge>
                            <h4 className={styles.findingTitle}>{finding.title}</h4>
                          </div>
                          <p className={styles.findingDescription}>{finding.description}</p>
                          {finding.recommendation && (
                            <div className={styles.recommendationSection}>
                              <Button
                                variant="ghost"
                                onClick={() => toggleRecommendation(finding.id)}
                                className={styles.recommendationToggle}
                              >
                                {expandedRecommendations.has(finding.id) ? '▼' : '▶'} Recommendation
                              </Button>
                              {expandedRecommendations.has(finding.id) && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                  className={styles.recommendation}
                                >
                                  {finding.recommendation}
                                </motion.div>
                              )}
                            </div>
                          )}
                        </Card>
                      ))}
                    </Stagger>
                  </div>
                ))}
              </Stagger>
            )}
          </div>

          {/* Premium Insights Section */}
          <div className={styles.premiumSection}>
            <SectionHeader
              title="Premium Insights"
              subtitle="Unlock advanced analysis and actionable recommendations"
            />
            <div className={styles.premiumGrid}>
              <Card className={styles.premiumCard}>
                <div className={styles.premiumLocked}>
                  <div className={styles.lockIcon}>🔒</div>
                  <h3 className={styles.premiumTitle}>Prioritised Fix Plan</h3>
                  <p className={styles.premiumDescription}>
                    Get a customised action plan with estimated effort for each fix.
                  </p>
                </div>
              </Card>
              <Card className={styles.premiumCard}>
                <div className={styles.premiumLocked}>
                  <div className={styles.lockIcon}>🔒</div>
                  <h3 className={styles.premiumTitle}>GDPR Risk Summary</h3>
                  <p className={styles.premiumDescription}>
                    Plain English explanation of GDPR compliance risks and remediation guidance.
                  </p>
                </div>
              </Card>
              <Card className={styles.premiumCard}>
                <div className={styles.premiumLocked}>
                  <div className={styles.lockIcon}>🔒</div>
                  <h3 className={styles.premiumTitle}>Competitor Benchmark</h3>
                  <p className={styles.premiumDescription}>
                    See how your security posture compares to industry benchmarks.
                  </p>
                </div>
              </Card>
            </div>
            <div className={styles.premiumCTA}>
              <Link href={`/pricing?scan_id=${scanId}`}>
                <Button variant="primary" className={styles.upgradeButton}>
                  Upgrade to Unlock
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Back to Top Button - Mobile Only */}
      <AnimatePresence>
        {showBackToTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className={styles.backToTop}
            aria-label="Back to top"
          >
            <ChevronUp size={20} />
          </motion.button>
        )}
      </AnimatePresence>
    </Layout>
  )
}
