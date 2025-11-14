"use client"

import { useEffect, useMemo, useState } from 'react'
import { ApiService } from '@/services/apiService'
import { useLineAuth } from '@/hooks/use-line-auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface Plan {
  id: string
  code: string
  name: string
  description?: string
  period: 'one_time' | 'monthly' | 'yearly'
  price_twd: number
  features?: Record<string, any>
  is_active: boolean
}

const FALLBACK_PLANS: Plan[] = [
  {
    id: 'free', code: 'free', name: 'Free', period: 'one_time', price_twd: 0, is_active: true,
    description: '入門免費版，滿足基本學習管理需求',
    features: { fileMaxSizeMB: 10, unlimitedUploads: false, advancedReminders: false, aiSuggest: false, aiLimitPerDay: 10, syncFrequency: 'daily' }
  },
  {
    id: 'pro_month', code: 'pro_month', name: 'Pro（個人）', period: 'monthly', price_twd: 199, is_active: true,
    description: '進階個人版，提升效率與體驗',
    features: { fileMaxSizeMB: 100, unlimitedUploads: true, advancedReminders: true, aiSuggest: true, aiLimitPerDay: 100, syncFrequency: 'hourly' }
  },
  {
    id: 'school_year', code: 'school_year', name: 'School（機構）', period: 'yearly', price_twd: 19900, is_active: true,
    description: '學校/機構集中授權與席次管理',
    features: { seatManagement: true, orgReports: true, prioritySupport: true, aiSuggest: true, syncFrequency: 'hourly' }
  }
]

export default function PricingPage() {
  const { isInitialized, isLoggedIn, user, isLoading } = useLineAuth()
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentPlanCode, setCurrentPlanCode] = useState<string>('')
  const [currentEndAt, setCurrentEndAt] = useState<string>('')
  const [hasActive, setHasActive] = useState<boolean>(false)

  useEffect(() => {
    const run = async () => {
      try {
        const resp = await ApiService.getPlans()
        const items: Plan[] = Array.isArray((resp as any)?.data) ? (resp as any).data : ((resp as any)?.data?.results || [])
        setPlans(items && items.length > 0 ? items : FALLBACK_PLANS)
      } catch (e) {
        setPlans(FALLBACK_PLANS)
      }
    }
    run()
  }, [])

  useEffect(() => {
    if (isLoggedIn && user?.userId) {
      ApiService.setLineUserId(user.userId)
      ;(async () => {
        const resp = await ApiService.getMySubscriptions()
        const items = (resp as any)?.data?.items || []
        const now = Date.now()
        const active = items.find((x: any) => x.status === 'active' && new Date(x.end_at).getTime() > now)
        setHasActive(Boolean(active))
        if (active?.plan?.code) {
          setCurrentPlanCode(active.plan.code)
          setCurrentEndAt(active.end_at)
        } else {
          setCurrentPlanCode('')
          setCurrentEndAt('')
        }
      })()
    }
  }, [isLoggedIn, user?.userId])

  const startCheckout = async (plan: Plan) => {
    try {
      setLoading(true)
      setError(null)
      const now = Date.now()
      if (hasActive && currentEndAt && new Date(currentEndAt).getTime() > now) {
        alert(`您已是尊貴會員，訂閱期至 ${new Date(currentEndAt).toLocaleDateString()}`)
        window.location.href = '/me/subscriptions'
        setLoading(false)
        return
      }
      const origin = typeof window !== 'undefined' ? window.location.origin : ''
      const confirmUrl = `${origin}/checkout/return`
      const cancelUrl = `${origin}/checkout/return`
      const memberUrl = `${origin}/me/subscriptions`
      const qs = new URLSearchParams({ planCode: plan.code, seatCount: String(1), confirmUrl, cancelUrl, memberUrl }).toString()
      window.location.href = `/api/v2/checkout/linepay/request?${qs}`
    } catch (e) {
      setError('結帳請求失敗')
      setLoading(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold">教育方案</h1>
      <p className="text-sm text-muted-foreground">結合 LINE 與 Google Classroom/Calendar，簡化作業建立與提醒，提升課程管理效率</p>
      {error && <div className="text-red-600 text-sm">{error}</div>}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans.map(p => (
          <Card key={p.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span>{p.name}</span>
                  {currentPlanCode && currentPlanCode === p.code && (
                    <Badge>目前方案</Badge>
                  )}
                </span>
                <span className="text-primary">NT$ {p.price_twd}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm text-muted-foreground">{p.description || ''}</div>
              <ul className="text-sm space-y-1">
                {renderFeatureBullets(p).map((t, idx) => (
                  <li key={idx}>• {t}</li>
                ))}
              </ul>
              {p.code === 'free' ? (
                <Button disabled className="w-full" variant="outline">已啟用</Button>
              ) : p.code === 'school_year' ? (
                <a href="mailto:hello@example.com?subject=School方案洽詢" className="block">
                  <Button disabled={loading} className="w-full" variant="secondary">聯絡我們</Button>
                </a>
              ) : currentPlanCode && currentPlanCode === p.code ? (
                <Button disabled className="w-full" variant="outline">目前方案</Button>
              ) : (
                <Button disabled={loading || !isInitialized} onClick={() => startCheckout(p)} className="w-full">使用 LINE Pay 購買</Button>
              )}
              {currentPlanCode && currentPlanCode === p.code && currentEndAt && (
                <div className="text-xs text-muted-foreground text-center">到期日 {new Date(currentEndAt).toLocaleDateString()}</div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

function renderFeatureBullets(p: Plan): string[] {
  const f = p.features || {}
  const bullets: string[] = []
  if (p.code === 'free') {
    bullets.push('基本提醒與每日同步')
    bullets.push('AI建議（每日 10 次）')
    bullets.push(`單檔上限 ${f.fileMaxSizeMB ?? 10} MB`)
  } else if (p.code === 'pro_month') {
    bullets.push('進階提醒（多時點、催繳）')
    bullets.push(`AI建議（每日 ${f.aiLimitPerDay ?? 100} 次）`)
    bullets.push('Google Classroom/Calendar 小時級同步')
    bullets.push(`單檔上限 ${f.fileMaxSizeMB ?? 100} MB，支援大量上傳`)
  } else if (p.code === 'school_year') {
    bullets.push('席次管理與集中授權')
    bullets.push('學校報表與使用分析')
    bullets.push('優先技術支援')
  } else {
    bullets.push('進階功能與更高配額')
  }
  return bullets
}
