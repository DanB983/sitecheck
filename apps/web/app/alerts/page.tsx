'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import Layout from '@/components/Layout/Layout'
import Card from '@/components/ui/Card/Card'
import Button from '@/components/ui/Button/Button'
import Badge from '@/components/ui/Badge/Badge'
import SectionHeader from '@/components/ui/SectionHeader/SectionHeader'
import PageTransition from '@/components/ui/PageTransition/PageTransition'
import { FadeIn } from '@/components/ui/Motion/Motion'
import { Bell, ExternalLink, AlertTriangle, TrendingDown, Shield } from 'lucide-react'
import styles from './page.module.css'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface Alert {
  id: number
  site_id: number
  scan_id: number
  alert_type: 'score_drop' | 'new_critical' | 'new_high'
  message: string
  created_at: string
  site_domain: string
  site_display_name: string
}

interface AlertGroup {
  site_id: number
  site_domain: string
  site_display_name: string
  alerts: Alert[]
}

export default function AlertsPage() {
  const router = useRouter()
  const [alertGroups, setAlertGroups] = useState<AlertGroup[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAlerts()
  }, [])

  const fetchAlerts = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/alerts`)
      if (!response.ok) {
        throw new Error('Failed to fetch alerts')
      }
      const data = await response.json()
      setAlertGroups(data)
    } catch (err) {
      toast.error('Failed to load alerts', {
        description: err instanceof Error ? err.message : 'Unknown error'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleViewReport = (scanId: number) => {
    router.push(`/report/${scanId}`)
  }

  const getAlertIcon = (alertType: string) => {
    switch (alertType) {
      case 'score_drop':
        return <TrendingDown size={18} />
      case 'new_critical':
        return <Shield size={18} />
      case 'new_high':
        return <AlertTriangle size={18} />
      default:
        return <Bell size={18} />
    }
  }

  const getAlertVariant = (alertType: string) => {
    switch (alertType) {
      case 'score_drop':
        return 'warning'
      case 'new_critical':
        return 'error'
      case 'new_high':
        return 'error'
      default:
        return 'info'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  return (
    <Layout>
      <PageTransition>
        <div className={styles.alertsPage}>
          <div className={styles.container}>
            <FadeIn>
              <SectionHeader
                title="Alerts"
                subtitle="Security and compliance alerts for your monitored sites"
              />

              {loading ? (
                <Card className={styles.loadingCard}>
                  <div className={styles.loading}>Loading alerts...</div>
                </Card>
              ) : alertGroups.length === 0 ? (
                <Card className={styles.emptyCard}>
                  <Bell size={48} className={styles.emptyIcon} />
                  <h3 className={styles.emptyTitle}>No alerts</h3>
                  <p className={styles.emptyDescription}>
                    All monitored sites are stable.
                  </p>
                </Card>
              ) : (
                <div className={styles.alertsList}>
                  {alertGroups.map((group) => (
                    <Card key={group.site_id} className={styles.alertGroup}>
                      <div className={styles.groupHeader}>
                        <div>
                          <h3 className={styles.siteName}>{group.site_display_name}</h3>
                          <p className={styles.siteDomain}>{group.site_domain}</p>
                        </div>
                        <Badge variant="info">{group.alerts.length} alert{group.alerts.length !== 1 ? 's' : ''}</Badge>
                      </div>

                      <div className={styles.alerts}>
                        {group.alerts.map((alert) => (
                          <div key={alert.id} className={styles.alertItem}>
                            <div className={styles.alertContent}>
                              <div className={styles.alertHeader}>
                                <div className={styles.alertIcon}>
                                  {getAlertIcon(alert.alert_type)}
                                </div>
                                <Badge variant={getAlertVariant(alert.alert_type)}>
                                  {alert.alert_type.replace('_', ' ')}
                                </Badge>
                                <span className={styles.alertTime}>
                                  {formatDate(alert.created_at)}
                                </span>
                              </div>
                              <p className={styles.alertMessage}>{alert.message}</p>
                            </div>
                            <Button
                              variant="secondary"
                              onClick={() => handleViewReport(alert.scan_id)}
                              className={styles.viewButton}
                            >
                              <ExternalLink size={16} />
                              View Report
                            </Button>
                          </div>
                        ))}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </FadeIn>
          </div>
        </div>
      </PageTransition>
    </Layout>
  )
}

