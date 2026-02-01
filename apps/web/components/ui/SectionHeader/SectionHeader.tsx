import styles from './SectionHeader.module.css'
import { HTMLAttributes, ReactNode } from 'react'

interface SectionHeaderProps extends HTMLAttributes<HTMLDivElement> {
  title: string
  subtitle?: string
  action?: ReactNode
}

export default function SectionHeader({ 
  title, 
  subtitle,
  action,
  className = '',
  ...props 
}: SectionHeaderProps) {
  return (
    <div className={`${styles.sectionHeader} ${className}`} {...props}>
      <div>
        <h2 className={styles.title}>{title}</h2>
        {subtitle && (
          <p className={styles.subtitle}>{subtitle}</p>
        )}
      </div>
      {action && (
        <div className={styles.action}>
          {action}
        </div>
      )}
    </div>
  )
}

