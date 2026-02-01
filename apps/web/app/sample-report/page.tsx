import Link from 'next/link'
import Layout from '@/components/Layout/Layout'
import Card from '@/components/ui/Card/Card'
import Button from '@/components/ui/Button/Button'
import Badge from '@/components/ui/Badge/Badge'
import SectionHeader from '@/components/ui/SectionHeader/SectionHeader'
import styles from './page.module.css'

export default function SampleReportPage() {
  // Sample data
  const sampleScan = {
    url: 'https://example.com',
    normalized_url: 'https://example.com',
    final_url: 'https://example.com',
    response_status: 200,
    overall_score: 72,
    risk_level: 'medium' as const,
    created_at: new Date().toISOString(),
    findings: [
      {
        id: 1,
        category: 'security' as const,
        severity: 'high' as const,
        title: 'Missing HSTS Header',
        description: 'The Strict-Transport-Security header is not present, which could allow man-in-the-middle attacks.',
        recommendation: 'Add HSTS header with max-age of at least 31536000 seconds.'
      },
      {
        id: 2,
        category: 'security' as const,
        severity: 'medium' as const,
        title: 'Missing Content-Security-Policy',
        description: 'No Content-Security-Policy header detected, leaving the site vulnerable to XSS attacks.',
        recommendation: 'Implement a Content-Security-Policy header to restrict resource loading.'
      },
      {
        id: 3,
        category: 'gdpr' as const,
        severity: 'medium' as const,
        title: 'Cookie Consent Not Detected',
        description: 'Cookies are present but no obvious consent mechanism was found.',
        recommendation: 'Implement a clear cookie consent banner that appears before cookies are set.'
      },
      {
        id: 4,
        category: 'security' as const,
        severity: 'low' as const,
        title: 'Server Version Disclosure',
        description: 'Server header reveals version information that could aid attackers.',
        recommendation: 'Remove or obfuscate server version information in response headers.'
      },
      {
        id: 5,
        category: 'security' as const,
        severity: 'info' as const,
        title: 'Robots.txt Not Found',
        description: 'No robots.txt file was found at the root of the domain.',
        recommendation: 'Consider adding a robots.txt file to control search engine crawling.'
      }
    ]
  }

  const severityCounts = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 1,
    info: 1
  }

  const groupedFindings = sampleScan.findings.reduce((acc, finding) => {
    if (!acc[finding.category]) {
      acc[finding.category] = []
    }
    acc[finding.category].push(finding)
    return acc
  }, {} as Record<string, typeof sampleScan.findings>)

  return (
    <Layout>
      <div className={styles.sampleReportPage}>
        <div className={styles.container}>
          <div className={styles.sampleBanner}>
            <Card className={styles.bannerCard}>
              <div className={styles.bannerContent}>
                <div className={styles.bannerIcon}>📄</div>
                <div>
                  <h2 className={styles.bannerTitle}>Sample Security Report</h2>
                  <p className={styles.bannerDescription}>
                    This is an example of what your security and compliance report will look like. 
                    All data shown here is fictional and for demonstration purposes only.
                  </p>
                </div>
                <Link href="/scan">
                  <Button variant="primary">Scan Your Website</Button>
                </Link>
              </div>
            </Card>
          </div>

          <SectionHeader
            title="Security & Compliance Report"
            subtitle={`Sample report for ${sampleScan.url}`}
          />

          {/* Summary Row */}
          <div className={styles.summaryRow}>
            <Card className={styles.scoreCard}>
              <div className={styles.scoreLabel}>Overall Score</div>
              <div className={styles.scoreValue}>72</div>
              <div className={styles.riskBadgeContainer}>
                <Badge variant="medium">Medium Risk</Badge>
              </div>
              <div className={styles.urlSection}>
                <div className={styles.urlLabel}>URL</div>
                <div className={styles.urlValue}>{sampleScan.normalized_url}</div>
              </div>
            </Card>

            <Card className={styles.detailsCard}>
              <h3 className={styles.detailsTitle}>Scan Details</h3>
              <div className={styles.detailsGrid}>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Status Code</span>
                  <span className={styles.detailValue}>{sampleScan.response_status}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Created</span>
                  <span className={styles.detailValue}>
                    {new Date(sampleScan.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </Card>
          </div>

          {/* Severity Breakdown */}
          <Card className={styles.breakdownCard}>
            <h3 className={styles.breakdownTitle}>Severity Breakdown</h3>
            <div className={styles.severityTiles}>
              <div className={styles.severityTile}>
                <Badge variant="critical">critical</Badge>
                <div className={styles.severityCount}>{severityCounts.critical}</div>
              </div>
              <div className={styles.severityTile}>
                <Badge variant="high">high</Badge>
                <div className={styles.severityCount}>{severityCounts.high}</div>
              </div>
              <div className={styles.severityTile}>
                <Badge variant="medium">medium</Badge>
                <div className={styles.severityCount}>{severityCounts.medium}</div>
              </div>
              <div className={styles.severityTile}>
                <Badge variant="low">low</Badge>
                <div className={styles.severityCount}>{severityCounts.low}</div>
              </div>
              <div className={styles.severityTile}>
                <Badge variant="info">info</Badge>
                <div className={styles.severityCount}>{severityCounts.info}</div>
              </div>
            </div>
          </Card>

          {/* Findings */}
          <div className={styles.findingsSection}>
            <SectionHeader
              title="Findings"
              subtitle={`${sampleScan.findings.length} total finding${sampleScan.findings.length !== 1 ? 's' : ''}`}
            />

            {Object.entries(groupedFindings).map(([category, findings]) => (
              <div key={category} className={styles.categoryGroup}>
                <h3 className={styles.categoryTitle}>
                  {category.charAt(0).toUpperCase() + category.slice(1)} ({findings.length})
                </h3>
                <div className={styles.findingsList}>
                  {findings.map((finding) => (
                    <Card key={finding.id} className={styles.findingCard}>
                      <div className={styles.findingHeader}>
                        <Badge variant={finding.severity}>
                          {finding.severity}
                        </Badge>
                        <h4 className={styles.findingTitle}>{finding.title}</h4>
                      </div>
                      <p className={styles.findingDescription}>{finding.description}</p>
                      {finding.recommendation && (
                        <div className={styles.recommendationSection}>
                          <div className={styles.recommendation}>
                            <strong>Recommendation:</strong> {finding.recommendation}
                          </div>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <Card className={styles.ctaCard}>
            <div className={styles.ctaContent}>
              <h3 className={styles.ctaTitle}>Ready to scan your website?</h3>
              <p className={styles.ctaDescription}>
                Get your own comprehensive security and compliance report in 60 seconds.
              </p>
              <Link href="/scan">
                <Button variant="primary" className={styles.ctaButton}>
                  Start Your Scan
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  )
}

