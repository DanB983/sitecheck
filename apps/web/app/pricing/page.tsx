'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Layout from '@/components/Layout/Layout'
import PageTransition from '@/components/ui/PageTransition/PageTransition'
import Card from '@/components/ui/Card/Card'
import Button from '@/components/ui/Button/Button'
import SectionHeader from '@/components/ui/SectionHeader/SectionHeader'
import { ChevronDown, ChevronUp } from 'lucide-react'
import styles from './page.module.css'

type UserType = 'site_owner' | 'agency'

export default function PricingPage() {
  const searchParams = useSearchParams()
  const scanId = searchParams.get('scan_id')
  const feature = searchParams.get('feature')
  
  const [userType, setUserType] = useState<UserType>('site_owner')
  const [expandedFeatures, setExpandedFeatures] = useState<Set<string>>(new Set())
  const [expandedFAQ, setExpandedFAQ] = useState<Set<string>>(new Set())
  const [compareExpanded, setCompareExpanded] = useState(false)

  // Set user type based on feature param
  useEffect(() => {
    if (feature === 'branded_pdf' || feature === 'white_label') {
      setUserType('agency')
    } else if (feature === 'monitoring') {
      setUserType('site_owner')
    }
  }, [feature])

  const toggleFeature = (planId: string) => {
    const newSet = new Set(expandedFeatures)
    if (newSet.has(planId)) {
      newSet.delete(planId)
    } else {
      newSet.add(planId)
    }
    setExpandedFeatures(newSet)
  }

  const toggleFAQ = (faqId: string) => {
    const newSet = new Set(expandedFAQ)
    if (newSet.has(faqId)) {
      newSet.delete(faqId)
    } else {
      newSet.add(faqId)
    }
    setExpandedFAQ(newSet)
  }

  const recommendedPlan = userType === 'agency' ? 'agency' : 'monitoring'

  return (
    <Layout>
      <PageTransition>
        <div className={styles.pricingPage}>
        <div className={styles.container}>
            {/* Contextual Upgrade Messaging */}
            {feature && (
              <div className={styles.featureBanner}>
                <p className={styles.featureBannerText}>
                  {feature === 'branded_pdf' && 'This feature is included in the Agency plan'}
                  {feature === 'monitoring' && 'This feature is included in the Monitoring plan'}
                  {feature === 'white_label' && 'This feature is included in the Agency plan'}
                </p>
              </div>
            )}

            {/* Header */}
            <div className={styles.header}>
              <h1 className={styles.title}>Pricing</h1>
              <p className={styles.subtitle}>
                Run one-off audits or monitor sites continuously. Built for agencies and site owners.
              </p>
            </div>

            {/* Toggle */}
            <div className={styles.toggleWrapper}>
              <div className={styles.toggle}>
                <button
                  className={`${styles.toggleOption} ${userType === 'site_owner' ? styles.toggleActive : ''}`}
                  onClick={() => setUserType('site_owner')}
                  aria-pressed={userType === 'site_owner'}
                >
                  Site Owner
                </button>
                <button
                  className={`${styles.toggleOption} ${userType === 'agency' ? styles.toggleActive : ''}`}
                  onClick={() => setUserType('agency')}
                  aria-pressed={userType === 'agency'}
                >
                  Agency
                </button>
              </div>
            </div>

            {/* Pricing Cards */}
          <div className={styles.plans}>
              {/* One-off Report */}
              <Card 
                className={`${styles.plan} ${styles.planBasic}`}
                id="plan-oneoff"
              >
                <div className={styles.planHeader}>
                  <h3 className={styles.planName}>One-off Report</h3>
              <div className={styles.planPrice}>
                    <span className={styles.price}>€9</span>
                <span className={styles.period}>one-time</span>
              </div>
                </div>
                <p className={styles.planBestFor}>Best for quick security checks</p>
              <ul className={styles.features}>
                <li>Single website scan</li>
                <li>Security & GDPR report</li>
                  <li>Actionable recommendations</li>
                <li>PDF export</li>
              </ul>
                <button
                  className={styles.expandFeatures}
                  onClick={() => toggleFeature('oneoff')}
                  aria-expanded={expandedFeatures.has('oneoff')}
                >
                  See what's included
                  {expandedFeatures.has('oneoff') ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                {expandedFeatures.has('oneoff') && (
                  <ul className={styles.expandedFeatures}>
                    <li>HTTPS/TLS validation</li>
                    <li>Security headers check</li>
                    <li>Cookie & GDPR indicators</li>
                    <li>SEO basics</li>
                  </ul>
                )}
              <Button variant="secondary" disabled className={styles.planButton}>
                  Get report
              </Button>
            </Card>

              {/* Monitoring */}
              <Card 
                className={`${styles.plan} ${styles.planRecommended} ${recommendedPlan === 'monitoring' ? styles.planHighlighted : ''}`}
                id="plan-monitoring"
              >
                {recommendedPlan === 'monitoring' && (
                  <div className={styles.recommendedLabel}>Recommended</div>
                )}
                <div className={styles.planHeader}>
                  <h3 className={styles.planName}>Monitoring</h3>
              <div className={styles.planPrice}>
                <span className={styles.price}>€29</span>
                <span className={styles.period}>/ month</span>
              </div>
                </div>
                <p className={styles.planBestFor}>Best for ongoing security oversight</p>
              <ul className={styles.features}>
                <li>Unlimited scans</li>
                  <li>Scheduled monitoring</li>
                  <li>Alert notifications</li>
                  <li>Scan history & trends</li>
                <li>Priority support</li>
                  <li>PDF export</li>
                </ul>
                <button
                  className={styles.expandFeatures}
                  onClick={() => toggleFeature('monitoring')}
                  aria-expanded={expandedFeatures.has('monitoring')}
                >
                  See what's included
                  {expandedFeatures.has('monitoring') ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                {expandedFeatures.has('monitoring') && (
                  <ul className={styles.expandedFeatures}>
                    <li>Daily, weekly, or monthly scans</li>
                    <li>Score drop alerts</li>
                    <li>New critical issue notifications</li>
                    <li>Email alerts (coming soon)</li>
              </ul>
                )}
                <Button 
                  variant={recommendedPlan === 'monitoring' ? 'primary' : 'secondary'} 
                  disabled 
                  className={styles.planButton}
                >
                  Start monitoring
              </Button>
            </Card>

              {/* Agency */}
              <Card 
                className={`${styles.plan} ${styles.planAgency} ${recommendedPlan === 'agency' ? styles.planHighlighted : ''}`}
                id="plan-agency"
              >
                {recommendedPlan === 'agency' && (
                  <div className={styles.recommendedLabel}>Recommended</div>
                )}
                <div className={styles.planHeader}>
                  <h3 className={styles.planName}>Agency</h3>
              <div className={styles.planPrice}>
                <span className={styles.price}>€99</span>
                <span className={styles.period}>/ month</span>
              </div>
                </div>
                <p className={styles.planBestFor}>Best for client deliverables</p>
              <ul className={styles.features}>
                  <li>Everything in Monitoring</li>
                  <li>White-label branded PDFs</li>
                  <li>Client site management</li>
                  <li>Shareable report links</li>
                <li>Dedicated support</li>
                  <li>API access</li>
                </ul>
                <button
                  className={styles.expandFeatures}
                  onClick={() => toggleFeature('agency')}
                  aria-expanded={expandedFeatures.has('agency')}
                >
                  See what's included
                  {expandedFeatures.has('agency') ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                {expandedFeatures.has('agency') && (
                  <ul className={styles.expandedFeatures}>
                    <li>Custom logos & colors</li>
                    <li>Branded footer text</li>
                    <li>Unlimited brand profiles</li>
                    <li>Client dashboard access</li>
              </ul>
                )}
                <Button 
                  variant={recommendedPlan === 'agency' ? 'primary' : 'secondary'} 
                  disabled 
                  className={styles.planButton}
                >
                  Contact us
                </Button>
            </Card>
          </div>

            {/* Trust Line */}
            <div className={styles.trustLine}>
              <p>Non-invasive scans • Cancel anytime • No access required</p>
              <p className={styles.vatNote}>Prices shown in EUR. VAT may apply.</p>
            </div>

            {/* Expandable Compare Plans */}
            <div className={styles.compareSection}>
              <button
                className={styles.compareToggle}
                onClick={() => setCompareExpanded(!compareExpanded)}
                aria-expanded={compareExpanded}
              >
                <span>Compare plans</span>
                {compareExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>
              
              {compareExpanded && (
                <div className={styles.comparisonContent}>
                  <div className={styles.comparisonGrid}>
                    <div className={styles.comparisonColumn}>
                      <h4 className={styles.comparisonTitle}>Included in all plans</h4>
                      <ul className={styles.comparisonList}>
                        <li>Non-invasive scanning</li>
                        <li>Security headers check</li>
                        <li>HTTPS/TLS validation</li>
                        <li>GDPR compliance indicators</li>
                        <li>Actionable recommendations</li>
                        <li>PDF export</li>
                      </ul>
                    </div>
                    <div className={styles.comparisonColumn}>
                      <h4 className={styles.comparisonTitle}>Premium features</h4>
                      <ul className={styles.comparisonList}>
                        <li>Scheduled monitoring</li>
                        <li>Alert notifications</li>
                        <li>White-label reports</li>
                        <li>Shareable links</li>
                        <li>API access</li>
                        <li>Priority support</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* FAQ */}
            <div className={styles.faqSection}>
              <h2 className={styles.faqTitle}>Frequently asked questions</h2>
              <div className={styles.faqList}>
                <div className={styles.faqItem}>
                  <button
                    className={styles.faqQuestion}
                    onClick={() => toggleFAQ('pentest')}
                    aria-expanded={expandedFAQ.has('pentest')}
                  >
                    <span>Is this a pentest?</span>
                    {expandedFAQ.has('pentest') ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </button>
                  {expandedFAQ.has('pentest') && (
                    <div className={styles.faqAnswer}>
                      <p>No. SiteCheck performs non-invasive security scans that check headers, HTTPS configuration, and compliance indicators. We don't attempt to exploit vulnerabilities or access restricted areas. For comprehensive penetration testing, consult a specialized security firm.</p>
                    </div>
                  )}
                </div>

                <div className={styles.faqItem}>
                  <button
                    className={styles.faqQuestion}
                    onClick={() => toggleFAQ('break')}
                    aria-expanded={expandedFAQ.has('break')}
                  >
                    <span>Will this break my site?</span>
                    {expandedFAQ.has('break') ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </button>
                  {expandedFAQ.has('break') && (
                    <div className={styles.faqAnswer}>
                      <p>No. Our scanner only performs HTTP requests—the same type of requests a regular browser makes. We don't execute scripts, submit forms, or attempt any actions that could affect your site's functionality or data.</p>
                    </div>
                  )}
                </div>

                <div className={styles.faqItem}>
                  <button
                    className={styles.faqQuestion}
                    onClick={() => toggleFAQ('data')}
                    aria-expanded={expandedFAQ.has('data')}
                  >
                    <span>Do you store site data?</span>
                    {expandedFAQ.has('data') ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </button>
                  {expandedFAQ.has('data') && (
                    <div className={styles.faqAnswer}>
                      <p>We store scan results (scores, findings, metadata) to generate reports and enable monitoring. We don't store full page content or sensitive data. You can delete scans at any time, and shared links can be set to expire automatically.</p>
                    </div>
                  )}
                </div>

                <div className={styles.faqItem}>
                  <button
                    className={styles.faqQuestion}
                    onClick={() => toggleFAQ('share')}
                    aria-expanded={expandedFAQ.has('share')}
                  >
                    <span>Can I share reports with clients?</span>
                    {expandedFAQ.has('share') ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </button>
                  {expandedFAQ.has('share') && (
                    <div className={styles.faqAnswer}>
                      <p>Yes. All plans support shareable report links. Agency plans include white-label branded PDFs with your logo and colors, perfect for client deliverables. Share links can be set to expire after a specified time.</p>
            </div>
          )}
                </div>

                <div className={styles.faqItem}>
                  <button
                    className={styles.faqQuestion}
                    onClick={() => toggleFAQ('monitoring')}
                    aria-expanded={expandedFAQ.has('monitoring')}
                  >
                    <span>What does monitoring do?</span>
                    {expandedFAQ.has('monitoring') ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </button>
                  {expandedFAQ.has('monitoring') && (
                    <div className={styles.faqAnswer}>
                      <p>Monitoring automatically rescans your sites on a schedule (daily, weekly, or monthly). You'll receive alerts when security scores drop significantly or new critical issues are detected, helping you stay on top of your site's security posture.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
        </div>
      </div>
      </PageTransition>
    </Layout>
  )
}
