'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import Layout from '@/components/Layout/Layout'
import Card from '@/components/ui/Card/Card'
import Button from '@/components/ui/Button/Button'
import Badge from '@/components/ui/Badge/Badge'
import Modal from '@/components/ui/Modal/Modal'
import Input from '@/components/ui/Input/Input'
import SectionHeader from '@/components/ui/SectionHeader/SectionHeader'
import PageTransition from '@/components/ui/PageTransition/PageTransition'
import { FadeIn } from '@/components/ui/Motion/Motion'
import { Plus, ExternalLink, RefreshCw, Globe, AlertCircle, Settings, Bell } from 'lucide-react'
import styles from './page.module.css'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface Site {
  id: number
  domain: string
  display_name: string
  created_at: string
  latest_scan_score: number | null
  latest_scan_date: string | null
  latest_scan_risk_level: string | null
}

interface MonitoringConfig {
  id: number
  site_id: number
  frequency: 'daily' | 'weekly' | 'monthly'
  enabled: boolean
  last_run_at: string | null
  created_at: string
}

export default function DashboardPage() {
  const router = useRouter()
  const [sites, setSites] = useState<Site[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [addingSite, setAddingSite] = useState(false)
  const [newSiteDomain, setNewSiteDomain] = useState('')
  const [newSiteName, setNewSiteName] = useState('')
  const [rescanningSiteId, setRescanningSiteId] = useState<number | null>(null)
  const [showMonitoringModal, setShowMonitoringModal] = useState(false)
  const [selectedSiteId, setSelectedSiteId] = useState<number | null>(null)
  const [monitoringConfig, setMonitoringConfig] = useState<MonitoringConfig | null>(null)
  const [savingMonitoring, setSavingMonitoring] = useState(false)
  const [monitoringFrequency, setMonitoringFrequency] = useState<'daily' | 'weekly' | 'monthly'>('weekly')
  const [monitoringEnabled, setMonitoringEnabled] = useState(true)

  useEffect(() => {
    fetchSites()
  }, [])

  const fetchSites = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/sites`)
      if (!response.ok) {
        throw new Error('Failed to fetch sites')
      }
      const data = await response.json()
      setSites(data)
    } catch (err) {
      toast.error('Failed to load sites', {
        description: err instanceof Error ? err.message : 'Unknown error'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddSite = async (e: React.FormEvent) => {
    e.preventDefault()
    setAddingSite(true)

    try {
      const response = await fetch(`${API_BASE_URL}/sites`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          domain: newSiteDomain,
          display_name: newSiteName || newSiteDomain,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.detail || 'Failed to create site')
      }

      toast.success('Site added successfully')
      setShowAddModal(false)
      setNewSiteDomain('')
      setNewSiteName('')
      fetchSites()
    } catch (err) {
      toast.error('Failed to add site', {
        description: err instanceof Error ? err.message : 'Unknown error'
      })
    } finally {
      setAddingSite(false)
    }
  }

  const handleRescan = async (site: Site) => {
    setRescanningSiteId(site.id)
    const url = site.domain.startsWith('http') ? site.domain : `https://${site.domain}`

    try {
      const response = await fetch(`${API_BASE_URL}/scan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.detail || 'Failed to create scan')
      }

      const data = await response.json()
      toast.success('Scan started', {
        description: 'Redirecting to report...'
      })
      router.push(`/report/${data.scan_id}`)
    } catch (err) {
      toast.error('Failed to start scan', {
        description: err instanceof Error ? err.message : 'Unknown error'
      })
      setRescanningSiteId(null)
    }
  }

  const handleViewReport = (site: Site) => {
    // Get the latest scan for this site
    fetch(`${API_BASE_URL}/sites/${site.id}/scans?limit=1`)
      .then(res => res.json())
      .then(scans => {
        if (scans && scans.length > 0) {
          router.push(`/report/${scans[0].id}`)
        } else {
          toast.error('No scans found', {
            description: 'Please run a scan first'
          })
        }
      })
      .catch(() => {
        toast.error('Failed to load scan')
      })
  }

  const getRiskBadgeVariant = (riskLevel: string | null) => {
    if (!riskLevel) return 'info'
    switch (riskLevel.toLowerCase()) {
      case 'critical':
      case 'high':
        return 'error'
      case 'medium':
        return 'warning'
      case 'low':
        return 'success'
      default:
        return 'info'
    }
  }

  const handleOpenMonitoringSettings = async (siteId: number) => {
    setSelectedSiteId(siteId)
    setShowMonitoringModal(true)
    
    try {
      const response = await fetch(`${API_BASE_URL}/sites/${siteId}/monitoring`)
      if (response.ok) {
        const config = await response.json()
        setMonitoringConfig(config)
        setMonitoringFrequency(config.frequency)
        setMonitoringEnabled(config.enabled)
      } else if (response.status === 404) {
        // No config exists yet, use defaults
        setMonitoringConfig(null)
        setMonitoringFrequency('weekly')
        setMonitoringEnabled(true)
      }
    } catch (err) {
      // Default to creating new config
      setMonitoringConfig(null)
      setMonitoringFrequency('weekly')
      setMonitoringEnabled(true)
    }
  }

  const handleSaveMonitoring = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSiteId) return
    
    setSavingMonitoring(true)
    try {
      const url = `${API_BASE_URL}/sites/${selectedSiteId}/monitoring`
      const method = monitoringConfig ? 'PATCH' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          frequency: monitoringFrequency,
          enabled: monitoringEnabled,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.detail || 'Failed to save monitoring settings')
      }

      toast.success('Monitoring settings saved')
      setShowMonitoringModal(false)
      fetchSites()
    } catch (err) {
      toast.error('Failed to save monitoring settings', {
        description: err instanceof Error ? err.message : 'Unknown error'
      })
    } finally {
      setSavingMonitoring(false)
    }
  }

  return (
    <Layout>
      <PageTransition>
        <div className={styles.dashboardPage}>
          <div className={styles.container}>
            <FadeIn>
              <div className={styles.header}>
                <SectionHeader
                  title="Dashboard"
                  subtitle="Manage your websites and view scan results"
                />
                <Button
                  variant="primary"
                  onClick={() => setShowAddModal(true)}
                  className={styles.addButton}
                >
                  <Plus size={18} />
                  Add Site
                </Button>
              </div>

              {loading ? (
                <Card className={styles.loadingCard}>
                  <div className={styles.loading}>Loading sites...</div>
                </Card>
              ) : sites.length === 0 ? (
                <Card className={styles.emptyCard}>
                  <Globe size={48} className={styles.emptyIcon} />
                  <h3 className={styles.emptyTitle}>No sites yet</h3>
                  <p className={styles.emptyDescription}>
                    Add your first website to start monitoring security and GDPR compliance
                  </p>
                  <Button
                    variant="primary"
                    onClick={() => setShowAddModal(true)}
                  >
                    <Plus size={18} />
                    Add Your First Site
                  </Button>
                </Card>
              ) : (
                <div className={styles.sitesGrid}>
                  {sites.map((site) => (
                    <Card key={site.id} className={styles.siteCard}>
                      <div className={styles.siteHeader}>
                        <div className={styles.siteInfo}>
                          <h3 className={styles.siteName}>{site.display_name}</h3>
                          <p className={styles.siteDomain}>{site.domain}</p>
                        </div>
                        {site.latest_scan_risk_level && (
                          <Badge variant={getRiskBadgeVariant(site.latest_scan_risk_level)}>
                            {site.latest_scan_risk_level}
                          </Badge>
                        )}
                      </div>

                      <div className={styles.siteStats}>
                        {site.latest_scan_score !== null ? (
                          <>
                            <div className={styles.score}>
                              <span className={styles.scoreLabel}>Last Score</span>
                              <span className={styles.scoreValue}>{Math.round(site.latest_scan_score)}</span>
                            </div>
                            {site.latest_scan_date && (
                              <div className={styles.scanDate}>
                                {new Date(site.latest_scan_date).toLocaleDateString()}
                              </div>
                            )}
                          </>
                        ) : (
                          <div className={styles.noScan}>
                            <AlertCircle size={16} />
                            <span>No scans yet</span>
                          </div>
                        )}
                      </div>

                      <div className={styles.siteActions}>
                        <Button
                          variant="secondary"
                          onClick={() => handleOpenMonitoringSettings(site.id)}
                          className={styles.actionButton}
                          title="Monitoring settings"
                        >
                          <Settings size={16} />
                          Monitor
                        </Button>
                        {site.latest_scan_score !== null && (
                          <Button
                            variant="secondary"
                            onClick={() => handleViewReport(site)}
                            className={styles.actionButton}
                          >
                            <ExternalLink size={16} />
                            View Report
                          </Button>
                        )}
                        <Button
                          variant="primary"
                          onClick={() => handleRescan(site)}
                          disabled={rescanningSiteId === site.id}
                          className={styles.actionButton}
                        >
                          <RefreshCw size={16} className={rescanningSiteId === site.id ? styles.spinning : ''} />
                          {rescanningSiteId === site.id ? 'Scanning...' : 'Rescan'}
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </FadeIn>
          </div>
        </div>

        {/* Add Site Modal */}
        <Modal
          isOpen={showAddModal}
          onClose={() => {
            setShowAddModal(false)
            setNewSiteDomain('')
            setNewSiteName('')
          }}
          title="Add New Site"
        >
          <form onSubmit={handleAddSite} className={styles.addSiteForm}>
            <Input
              type="text"
              value={newSiteDomain}
              onChange={(e) => setNewSiteDomain(e.target.value)}
              placeholder="example.com"
              label="Domain"
              required
              leftIcon={<Globe size={18} />}
            />
            <Input
              type="text"
              value={newSiteName}
              onChange={(e) => setNewSiteName(e.target.value)}
              placeholder="My Website (optional)"
              label="Display Name"
              leftIcon={<Globe size={18} />}
            />
            <div className={styles.modalActions}>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setShowAddModal(false)
                  setNewSiteDomain('')
                  setNewSiteName('')
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={addingSite || !newSiteDomain.trim()}
              >
                {addingSite ? 'Adding...' : 'Add Site'}
              </Button>
            </div>
          </form>
        </Modal>

        {/* Monitoring Settings Modal */}
        <Modal
          isOpen={showMonitoringModal}
          onClose={() => {
            setShowMonitoringModal(false)
            setSelectedSiteId(null)
            setMonitoringConfig(null)
          }}
          title="Monitoring Settings"
        >
          <form onSubmit={handleSaveMonitoring} className={styles.monitoringForm}>
            <div className={styles.monitoringToggle}>
              <label className={styles.toggleLabel}>
                <input
                  type="checkbox"
                  checked={monitoringEnabled}
                  onChange={(e) => setMonitoringEnabled(e.target.checked)}
                  className={styles.toggleInput}
                />
                <span>Enable automatic monitoring</span>
              </label>
              <p className={styles.toggleDescription}>
                We'll automatically rescan this site and alert you if risk increases.
              </p>
            </div>

            {monitoringEnabled && (
              <div className={styles.frequencySelect}>
                <label className={styles.selectLabel}>Scan Frequency</label>
                <select
                  value={monitoringFrequency}
                  onChange={(e) => setMonitoringFrequency(e.target.value as 'weekly' | 'monthly')}
                  className={styles.select}
                >
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
                <p className={styles.selectDescription}>
                  How often to automatically scan this site for security and compliance issues
                </p>
              </div>
            )}

            {monitoringConfig && monitoringConfig.last_run_at && (
              <div className={styles.lastRun}>
                <p className={styles.lastRunLabel}>Last scan:</p>
                <p className={styles.lastRunValue}>
                  {new Date(monitoringConfig.last_run_at).toLocaleString()}
                </p>
              </div>
            )}

            <div className={styles.modalActions}>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setShowMonitoringModal(false)
                  setSelectedSiteId(null)
                  setMonitoringConfig(null)
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={savingMonitoring}
              >
                {savingMonitoring ? 'Saving...' : 'Save Settings'}
              </Button>
            </div>
          </form>
        </Modal>
      </PageTransition>
    </Layout>
  )
}

