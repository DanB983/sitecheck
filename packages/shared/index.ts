// Shared types and schemas for Elephantfly Scan

export type FindingCategory = 'security' | 'gdpr' | 'seo' | 'other'
export type FindingSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info'
export type RiskLevel = 'critical' | 'high' | 'medium' | 'low' | 'info'

export interface Finding {
  id: number
  category: FindingCategory
  severity: FindingSeverity
  title: string
  description: string
  recommendation: string | null
}

export interface Scan {
  id: number
  user_id: number | null
  url: string
  created_at: string
  overall_score: number | null
  risk_level: RiskLevel | null
  findings: Finding[]
}

export interface ScanCreateRequest {
  url: string
}

export interface ScanCreateResponse {
  scan_id: number
  url: string
  overall_score: number | null
  risk_level: RiskLevel | null
  findings_count: number
}

