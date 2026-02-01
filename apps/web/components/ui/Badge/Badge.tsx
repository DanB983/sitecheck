'use client'

import { AlertTriangle, Info, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import styles from './Badge.module.css'
import { HTMLAttributes, ReactNode } from 'react'
import clsx from 'clsx'

type BadgeVariant = 'critical' | 'high' | 'medium' | 'low' | 'info' | 'success' | 'warning' | 'danger'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant: BadgeVariant
  children: ReactNode
}

const iconMap = {
  critical: AlertTriangle,
  high: XCircle,
  medium: AlertCircle,
  low: Info,
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  danger: XCircle
}

export default function Badge({ 
  variant, 
  children, 
  className = '',
  ...props 
}: BadgeProps) {
  const Icon = iconMap[variant]
  const iconSize = 14

  return (
    <span 
      className={clsx(styles.badge, styles[variant], className)}
      {...props}
    >
      <Icon size={iconSize} className={styles.badgeIcon} />
      {children}
    </span>
  )
}
