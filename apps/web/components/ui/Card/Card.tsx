'use client'

import { HoverCard } from '../Motion/Motion'
import styles from './Card.module.css'
import { HTMLAttributes, ReactNode } from 'react'
import clsx from 'clsx'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  padding?: 'sm' | 'md' | 'lg'
  interactive?: boolean
}

export default function Card({ 
  children, 
  padding = 'md',
  interactive = false,
  className = '',
  ...props 
}: CardProps) {
  const cardContent = (
    <div 
      className={clsx(styles.card, styles[`padding-${padding}`], className)}
      {...props}
    >
      {children}
    </div>
  )

  if (interactive) {
    return <HoverCard className={styles.hoverCardWrapper}>{cardContent}</HoverCard>
  }

  return cardContent
}
