'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import Layout from '@/components/Layout/Layout'
import Card from '@/components/ui/Card/Card'
import Button from '@/components/ui/Button/Button'
import Input from '@/components/ui/Input/Input'
import SectionHeader from '@/components/ui/SectionHeader/SectionHeader'
import PageTransition from '@/components/ui/PageTransition/PageTransition'
import { Upload, Check, X } from 'lucide-react'
import styles from './page.module.css'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface BrandProfile {
  id: number
  name: string
  logo_base64: string | null
  primary_color: string
  accent_color: string
  footer_text: string | null
  is_default: boolean
  created_at: string
}

const ACTIVE_BRAND_KEY = 'sitecheck_active_brand_id'

export default function BrandingSettingsPage() {
  const router = useRouter()
  const [brands, setBrands] = useState<BrandProfile[]>([])
  const [activeBrandId, setActiveBrandId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [formData, setFormData] = useState({
    name: '',
    primary_color: '#2563eb',
    accent_color: '#10b981',
    footer_text: '',
    logo_base64: null as string | null
  })

  useEffect(() => {
    fetchBrands()
    loadActiveBrand()
  }, [])

  const loadActiveBrand = () => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(ACTIVE_BRAND_KEY)
      if (stored) {
        setActiveBrandId(parseInt(stored, 10))
      }
    }
  }

  const fetchBrands = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_BASE_URL}/brands`)
      if (!response.ok) throw new Error('Failed to fetch brands')
      const data = await response.json()
      setBrands(data)
    } catch (error) {
      toast.error('Failed to load brand profiles')
    } finally {
      setLoading(false)
    }
  }

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file')
      return
    }

    if (file.size > 2 * 1024 * 1024) { // 2MB limit
      toast.error('Logo must be smaller than 2MB')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const result = event.target?.result as string
      // Remove data:image/...;base64, prefix if present
      const base64 = result.includes(',') ? result.split(',')[1] : result
      setFormData(prev => ({ ...prev, logo_base64: base64 }))
      setLogoPreview(result)
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)

    try {
      const response = await fetch(`${API_BASE_URL}/brands`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.detail || 'Failed to create brand profile')
      }

      const newBrand = await response.json()
      toast.success('Brand profile created!')
      
      // Reset form
      setFormData({
        name: '',
        primary_color: '#2563eb',
        accent_color: '#10b981',
        footer_text: '',
        logo_base64: null
      })
      setLogoPreview(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      // Refresh brands list
      await fetchBrands()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred'
      toast.error(errorMessage)
    } finally {
      setCreating(false)
    }
  }

  const handleSelectBrand = (brandId: number) => {
    setActiveBrandId(brandId)
    if (typeof window !== 'undefined') {
      localStorage.setItem(ACTIVE_BRAND_KEY, brandId.toString())
    }
    toast.success('Brand profile selected')
  }

  return (
    <Layout>
      <PageTransition>
        <div className={styles.brandingPage}>
          <div className={styles.container}>
            <SectionHeader
              title="Brand Settings"
              subtitle="Create and manage brand profiles for white-label PDF reports"
            />

            {/* Create Brand Form */}
            <Card className={styles.formCard}>
              <h3 className={styles.formTitle}>Create New Brand Profile</h3>
              <form onSubmit={handleSubmit} className={styles.form}>
                <Input
                  label="Brand Name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Acme Agency"
                  required
                />

                <div className={styles.colorRow}>
                  <div className={styles.colorInput}>
                    <label className={styles.colorLabel}>Primary Color</label>
                    <div className={styles.colorPicker}>
                      <input
                        type="color"
                        value={formData.primary_color}
                        onChange={(e) => setFormData(prev => ({ ...prev, primary_color: e.target.value }))}
                        className={styles.colorInputField}
                      />
                      <Input
                        type="text"
                        value={formData.primary_color}
                        onChange={(e) => setFormData(prev => ({ ...prev, primary_color: e.target.value }))}
                        placeholder="#2563eb"
                        className={styles.colorTextInput}
                      />
                    </div>
                  </div>

                  <div className={styles.colorInput}>
                    <label className={styles.colorLabel}>Accent Color</label>
                    <div className={styles.colorPicker}>
                      <input
                        type="color"
                        value={formData.accent_color}
                        onChange={(e) => setFormData(prev => ({ ...prev, accent_color: e.target.value }))}
                        className={styles.colorInputField}
                      />
                      <Input
                        type="text"
                        value={formData.accent_color}
                        onChange={(e) => setFormData(prev => ({ ...prev, accent_color: e.target.value }))}
                        placeholder="#10b981"
                        className={styles.colorTextInput}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className={styles.uploadLabel}>Logo (Optional)</label>
                  <div className={styles.uploadSection}>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className={styles.fileInput}
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => fileInputRef.current?.click()}
                      className={styles.uploadButton}
                    >
                      <Upload size={18} />
                      Upload Logo
                    </Button>
                    {logoPreview && (
                      <div className={styles.logoPreview}>
                        <img src={logoPreview} alt="Logo preview" />
                        <button
                          type="button"
                          onClick={() => {
                            setLogoPreview(null)
                            setFormData(prev => ({ ...prev, logo_base64: null }))
                            if (fileInputRef.current) {
                              fileInputRef.current.value = ''
                            }
                          }}
                          className={styles.removeLogo}
                          aria-label="Remove logo"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                  <p className={styles.uploadHint}>PNG or JPG, max 2MB. Will be displayed in PDF header.</p>
                </div>

                <Input
                  label="Footer Text (Optional)"
                  type="text"
                  value={formData.footer_text}
                  onChange={(e) => setFormData(prev => ({ ...prev, footer_text: e.target.value }))}
                  placeholder="Custom footer text for PDF reports"
                />

                <Button
                  type="submit"
                  variant="primary"
                  disabled={creating || !formData.name.trim()}
                  className={styles.submitButton}
                >
                  {creating ? 'Creating...' : 'Create Brand Profile'}
                </Button>
              </form>
            </Card>

            {/* Existing Brands */}
            <Card className={styles.brandsCard}>
              <h3 className={styles.brandsTitle}>Your Brand Profiles</h3>
              {loading ? (
                <p className={styles.loadingText}>Loading...</p>
              ) : brands.length === 0 ? (
                <p className={styles.emptyText}>No brand profiles yet. Create one above.</p>
              ) : (
                <div className={styles.brandsList}>
                  {brands.map((brand) => (
                    <div
                      key={brand.id}
                      className={`${styles.brandItem} ${activeBrandId === brand.id ? styles.brandItemActive : ''}`}
                    >
                      <div className={styles.brandInfo}>
                        {brand.logo_base64 && (
                          <img
                            src={`data:image/png;base64,${brand.logo_base64}`}
                            alt={brand.name}
                            className={styles.brandLogo}
                          />
                        )}
                        <div className={styles.brandDetails}>
                          <h4 className={styles.brandName}>{brand.name}</h4>
                          <div className={styles.brandColors}>
                            <span
                              className={styles.colorSwatch}
                              style={{ backgroundColor: brand.primary_color }}
                              title={`Primary: ${brand.primary_color}`}
                            />
                            <span
                              className={styles.colorSwatch}
                              style={{ backgroundColor: brand.accent_color }}
                              title={`Accent: ${brand.accent_color}`}
                            />
                          </div>
                        </div>
                      </div>
                      <div className={styles.brandActions}>
                        {activeBrandId === brand.id ? (
                          <span className={styles.activeBadge}>
                            <Check size={16} />
                            Active
                          </span>
                        ) : (
                          <Button
                            variant="secondary"
                            onClick={() => handleSelectBrand(brand.id)}
                            className={styles.selectButton}
                          >
                            Select
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      </PageTransition>
    </Layout>
  )
}

