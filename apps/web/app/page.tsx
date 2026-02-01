'use client'

import Link from 'next/link'
import Layout from '@/components/Layout/Layout'
import Button from '@/components/ui/Button/Button'
import Card from '@/components/ui/Card/Card'
import SectionHeader from '@/components/ui/SectionHeader/SectionHeader'
import PageTransition from '@/components/ui/PageTransition/PageTransition'
import { FadeIn, Stagger } from '@/components/ui/Motion/Motion'
import { Shield, Cookie, CheckCircle2, Globe, ArrowRight, Lock, FileText, Layers, AlertCircle } from 'lucide-react'
import styles from './page.module.css'

export default function Home() {
  return (
    <Layout>
      <PageTransition>
        <div className={styles.landing}>
        {/* Hero Section */}
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <FadeIn>
              <h1 className={styles.heroTitle}>
                Instant Website Security & GDPR Scan
              </h1>
            </FadeIn>
            <FadeIn delay={0.2}>
              <p className={styles.heroSubtitle}>
                Get a comprehensive security and compliance report in 60 seconds. 
                No login required, no invasive scanning—just clear, actionable insights 
                to protect your website and your users.
              </p>
            </FadeIn>
            <FadeIn delay={0.4}>
              <div className={styles.ctaGroup}>
                <Link href="/scan">
                  <Button variant="primary" className={styles.primaryCTA}>
                    Scan my website
                    <ArrowRight size={18} />
                  </Button>
                </Link>
                <Link href="/sample-report">
                  <Button variant="secondary" className={styles.secondaryCTA}>
                    View sample report
                  </Button>
                </Link>
              </div>
            </FadeIn>
            <FadeIn delay={0.6}>
              <div className={styles.trustRow}>
                <span className={styles.trustItem}>
                  <CheckCircle2 size={16} />
                  No login required
                </span>
                <span className={styles.trustItem}>
                  <CheckCircle2 size={16} />
                  60 seconds
                </span>
                <span className={styles.trustItem}>
                  <CheckCircle2 size={16} />
                  Non-invasive
                </span>
              </div>
            </FadeIn>
          </div>
        </section>

        {/* Credibility Strip */}
        <section className={styles.credibilitySection}>
          <div className={styles.container}>
            <Stagger className={styles.credibilityGrid}>
              <Card className={styles.credibilityCard} interactive>
                <div className={styles.credibilityIcon}>
                  <Shield size={32} />
                </div>
                <h3 className={styles.credibilityTitle}>Security headers & HTTPS</h3>
                <p className={styles.credibilityDescription}>
                  Detect missing security headers, SSL/TLS issues, and encryption vulnerabilities.
                </p>
              </Card>
              <Card className={styles.credibilityCard} interactive>
                <div className={styles.credibilityIcon}>
                  <Cookie size={32} />
                </div>
                <h3 className={styles.credibilityTitle}>Cookie/GDPR signals</h3>
                <p className={styles.credibilityDescription}>
                  Check for cookie consent mechanisms and GDPR compliance indicators.
                </p>
              </Card>
              <Card className={styles.credibilityCard} interactive>
                <div className={styles.credibilityIcon}>
                  <CheckCircle2 size={32} />
                </div>
                <h3 className={styles.credibilityTitle}>Prioritised fixes</h3>
                <p className={styles.credibilityDescription}>
                  Get actionable recommendations sorted by impact and ease of implementation.
                </p>
              </Card>
            </Stagger>
          </div>
        </section>

        {/* How It Works */}
        <section className={styles.howItWorksSection}>
          <div className={styles.container}>
            <SectionHeader
              title="How it works"
              subtitle="Get your security report in three simple steps"
            />
            <Stagger className={styles.stepsGrid}>
              <div className={styles.step}>
                <div className={styles.stepNumber}>1</div>
                <h3 className={styles.stepTitle}>Enter URL</h3>
                <p className={styles.stepDescription}>
                  Simply paste your website URL. No account needed, no credit card required.
                </p>
              </div>
              <div className={styles.step}>
                <div className={styles.stepNumber}>2</div>
                <h3 className={styles.stepTitle}>We scan</h3>
                <p className={styles.stepDescription}>
                  Our non-invasive scanner checks security headers, HTTPS, cookies, and more in under a minute.
                </p>
              </div>
              <div className={styles.step}>
                <div className={styles.stepNumber}>3</div>
                <h3 className={styles.stepTitle}>You get a clear action plan</h3>
                <p className={styles.stepDescription}>
                  Receive a detailed report with prioritized fixes and step-by-step recommendations.
                </p>
              </div>
            </Stagger>
          </div>
        </section>

        {/* What We Check */}
        <section className={styles.whatWeCheckSection}>
          <div className={styles.container}>
            <SectionHeader
              title="What we check"
              subtitle="Comprehensive security and compliance scanning"
            />
            <Stagger className={styles.checksGrid}>
              <Card className={styles.checkCard} interactive>
                <div className={styles.checkIcon}>
                  <Lock size={24} />
                </div>
                <h4 className={styles.checkTitle}>HTTPS/TLS</h4>
                <p className={styles.checkDescription}>
                  Verify SSL certificate validity and encryption strength.
                </p>
              </Card>
              <Card className={styles.checkCard} interactive>
                <div className={styles.checkIcon}>
                  <ArrowRight size={24} />
                </div>
                <h4 className={styles.checkTitle}>Redirects</h4>
                <p className={styles.checkDescription}>
                  Analyze redirect chains and ensure proper HTTP to HTTPS redirects.
                </p>
              </Card>
              <Card className={styles.checkCard} interactive>
                <div className={styles.checkIcon}>
                  <Shield size={24} />
                </div>
                <h4 className={styles.checkTitle}>Security Headers</h4>
                <p className={styles.checkDescription}>
                  Check for HSTS, CSP, X-Frame-Options, and other security headers.
                </p>
              </Card>
              <Card className={styles.checkCard} interactive>
                <div className={styles.checkIcon}>
                  <Cookie size={24} />
                </div>
                <h4 className={styles.checkTitle}>Cookie Signals</h4>
                <p className={styles.checkDescription}>
                  Detect cookie usage and consent banner presence.
                </p>
              </Card>
              <Card className={styles.checkCard} interactive>
                <div className={styles.checkIcon}>
                  <Globe size={24} />
                </div>
                <h4 className={styles.checkTitle}>Robots.txt</h4>
                <p className={styles.checkDescription}>
                  Verify robots.txt configuration and indexing directives.
                </p>
              </Card>
              <Card className={styles.checkCard} interactive>
                <div className={styles.checkIcon}>
                  <AlertCircle size={24} />
                </div>
                <h4 className={styles.checkTitle}>Version Leakage</h4>
                <p className={styles.checkDescription}>
                  Identify server version disclosure in headers and responses.
                </p>
              </Card>
            </Stagger>
          </div>
        </section>

        {/* Pricing Preview */}
        <section className={styles.pricingPreviewSection}>
          <div className={styles.container}>
            <div className={styles.pricingPreviewHeader}>
              <h2 className={styles.pricingPreviewTitle}>Simple, transparent pricing</h2>
              <p className={styles.pricingPreviewSubtitle}>Choose the plan that fits your needs</p>
            </div>
            <Stagger className={styles.pricingPreviewGrid}>
              <Card className={styles.pricingPreviewCard}>
                <div className={styles.pricingPreviewCardHeader}>
                  <h3 className={styles.pricingPreviewName}>One-Off Report</h3>
                  <div className={styles.pricingPreviewPriceContainer}>
                    <span className={styles.pricingPreviewPrice}>€9</span>
                    <span className={styles.pricingPreviewPeriod}>one-time</span>
                  </div>
                </div>
                <ul className={styles.pricingPreviewFeatures}>
                  <li>Single website scan</li>
                  <li>Security & GDPR report</li>
                  <li>Basic recommendations</li>
                </ul>
                <Link href="/pricing" className={styles.pricingPreviewLink}>
                  <Button variant="secondary" fullWidth>Get report</Button>
                </Link>
              </Card>
              <Card className={`${styles.pricingPreviewCard} ${styles.pricingPreviewCardRecommended}`}>
                <div className={styles.pricingPreviewRecommendedLabel}>Recommended</div>
                <div className={styles.pricingPreviewCardHeader}>
                  <h3 className={styles.pricingPreviewName}>Monthly</h3>
                  <div className={styles.pricingPreviewPriceContainer}>
                    <span className={styles.pricingPreviewPrice}>€29</span>
                    <span className={styles.pricingPreviewPeriod}>/ month</span>
                  </div>
                </div>
                <ul className={styles.pricingPreviewFeatures}>
                  <li>Unlimited scans</li>
                  <li>Advanced security checks</li>
                  <li>Priority support</li>
                </ul>
                <Link href="/pricing" className={styles.pricingPreviewLink}>
                  <Button variant="primary" fullWidth>Start monitoring</Button>
                </Link>
              </Card>
              <Card className={styles.pricingPreviewCard}>
                <div className={styles.pricingPreviewCardHeader}>
                  <h3 className={styles.pricingPreviewName}>Agency</h3>
                  <div className={styles.pricingPreviewPriceContainer}>
                    <span className={styles.pricingPreviewPrice}>€99</span>
                    <span className={styles.pricingPreviewPeriod}>/ month</span>
                  </div>
                </div>
                <ul className={styles.pricingPreviewFeatures}>
                  <li>Everything in Monthly</li>
                  <li>White-label reports</li>
                  <li>Bulk scanning</li>
                </ul>
                <Link href="/pricing" className={styles.pricingPreviewLink}>
                  <Button variant="secondary" fullWidth>Contact us</Button>
                </Link>
              </Card>
            </Stagger>
            <FadeIn delay={0.4}>
              <div className={styles.pricingPreviewTrust}>
                <p>Non-invasive scans • Cancel anytime • No access required</p>
              </div>
            </FadeIn>
          </div>
        </section>

        {/* Footer */}
        <footer className={styles.footer}>
          <div className={styles.container}>
            <div className={styles.footerContent}>
              <div className={styles.footerBrand}>
                <p>Built by <strong>Elephantfly</strong></p>
              </div>
              <div className={styles.footerLinks}>
                <Link href="/pricing">Pricing</Link>
                <Link href="/scan">Scan</Link>
                <Link href="/sample-report">Sample Report</Link>
                <span className={styles.footerLinkDisabled}>Privacy</span>
                <span className={styles.footerLinkDisabled}>Terms</span>
              </div>
            </div>
          </div>
        </footer>
      </div>
      </PageTransition>
    </Layout>
  )
}
