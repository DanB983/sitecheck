'use client'

import { ReactNode } from 'react'
import styles from './Input.module.css'
import { InputHTMLAttributes } from 'react'
import clsx from 'clsx'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  leftIcon?: ReactNode
}

export default function Input({ 
  label, 
  error,
  helperText,
  leftIcon,
  className = '',
  ...props 
}: InputProps) {
  return (
    <div className={styles.inputWrapper}>
      {label && (
        <label className={styles.label}>
          {label}
        </label>
      )}
      <div className={styles.inputContainer}>
        {leftIcon && (
          <div className={styles.leftIcon}>
            {leftIcon}
          </div>
        )}
        <input 
          className={clsx(
            styles.input,
            error ? styles.error : '',
            leftIcon ? styles.inputWithIcon : '',
            className
          )}
          {...props}
        />
      </div>
      {error && (
        <span className={styles.errorMessage}>{error}</span>
      )}
      {!error && helperText && (
        <span className={styles.helperText}>{helperText}</span>
      )}
    </div>
  )
}
