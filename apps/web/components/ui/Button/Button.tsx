'use client'

import { motion, HTMLMotionProps } from 'framer-motion'
import styles from './Button.module.css'
import { ReactNode } from 'react'
import clsx from 'clsx'

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'variant'> {
  variant?: 'primary' | 'secondary' | 'ghost'
  fullWidth?: boolean
  children: ReactNode
}

export default function Button({ 
  variant = 'primary', 
  fullWidth = false,
  children, 
  className = '',
  ...props 
}: ButtonProps) {
  return (
    <motion.button
      className={clsx(
        styles.button, 
        styles[variant], 
        fullWidth && styles.fullWidth,
        className
      )}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      transition={{ duration: 0.15 }}
      {...props}
    >
      {children}
    </motion.button>
  )
}
