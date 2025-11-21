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
    id: 'school_year', code: 'school_year', name: 'School（機構）', period: 'yearly', price_twd: 0, is_active: true,
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
    const effectiveId = user?.userId || ApiService.bootstrapLineUserId()
    if (effectiveId) {
      ApiService.setLineUserId(effectiveId)
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
      const lineUserId = user?.userId || ApiService.bootstrapLineUserId()
      if (!lineUserId) {
        alert('尚未識別 LINE 用戶，請先登入後再購買')
        setLoading(false)
        return
      }
      const qs = new URLSearchParams({ planCode: plan.code, seatCount: String(1), confirmUrl, cancelUrl, memberUrl, line_user_id: lineUserId }).toString()
      window.location.href = `/api/v2/checkout/linepay/request?${qs}`
    } catch (e) {
      setError('結帳請求失敗')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        {/* 標題區域 */}
        <div className="text-center mb-12 sm:mb-16">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
            教育方案
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            結合 LINE 與 Google Classroom/Calendar，簡化作業建立與提醒，提升課程管理效率
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-sm text-center">
            {error}
          </div>
        )}

        {/* 方案卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {plans.map(p => {
            const isCurrent = currentPlanCode && currentPlanCode === p.code
            const isRecommended = p.code === 'pro_month'
            const isSchool = p.code === 'school_year'
            
            return (
              <Card 
                key={p.id} 
                className={`rounded-3xl overflow-hidden transition-all duration-300 hover:shadow-xl ${
                  isRecommended 
                    ? 'border-2 border-orange-500 shadow-lg scale-105 md:scale-110 relative' 
                    : 'border border-gray-200 hover:border-orange-300'
                }`}
              >
                {isRecommended && (
                  <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-orange-600 to-amber-600 text-white text-center py-2 text-sm font-semibold">
                    最受歡迎
                  </div>
                )}
                
                <CardHeader className={`${isRecommended ? 'pt-12' : 'pt-6'} pb-4`}>
                  <CardTitle className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold">{p.name}</span>
                      {isCurrent && (
                        <Badge className="bg-green-500 text-white rounded-full">目前方案</Badge>
                      )}
                    </div>
                    <div className="flex items-baseline gap-1">
                      {isSchool ? (
                        <span className="text-3xl font-bold text-primary">諮詢</span>
                      ) : (
                        <>
                          <span className="text-sm text-muted-foreground">NT$</span>
                          <span className="text-4xl font-bold text-primary">{p.price_twd}</span>
                          {p.period === 'monthly' && (
                            <span className="text-sm text-muted-foreground">/月</span>
                          )}
                        </>
                      )}
                    </div>
                  </CardTitle>
                </CardHeader>

                <CardContent className="space-y-6 pb-8">
                  <p className="text-sm text-muted-foreground min-h-[3rem]">
                    {p.description || ''}
                  </p>

                  <div className="space-y-3">
                    <div className="text-sm font-semibold text-gray-700">方案特色</div>
                    <ul className="space-y-2.5">
                      {renderFeatureBullets(p).map((t, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <span className="text-primary mt-0.5">✓</span>
                          <span className="flex-1">{t}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-4">
                    {p.code === 'free' ? (
                      <Button 
                        disabled 
                        className="w-full rounded-2xl h-12 text-base" 
                        variant="outline"
                      >
                        已啟用
                      </Button>
                    ) : isSchool ? (
                      <a href="mailto:hello@example.com?subject=School方案洽詢" className="block">
                        <Button 
                          disabled={loading} 
                          className="w-full rounded-2xl h-12 text-base"
                        >
                          聯絡我們
                        </Button>
                      </a>
                    ) : isCurrent ? (
                      <Button 
                        disabled 
                        className="w-full rounded-2xl h-12 text-base" 
                        variant="outline"
                      >
                        目前方案
                      </Button>
                    ) : (
                      <Button 
                        disabled={loading || !isInitialized} 
                        onClick={() => startCheckout(p)} 
                        className="w-full rounded-2xl h-12 text-base"
                      >
                        {loading ? '處理中...' : '使用 LINE Pay 購買'}
                      </Button>
                    )}
                    
                    {isCurrent && currentEndAt && (
                      <div className="text-xs text-muted-foreground text-center mt-3">
                        到期日：{new Date(currentEndAt).toLocaleDateString('zh-TW')}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* 底部說明 */}
        <div className="mt-12 sm:mt-16 text-center">
          <Card className="inline-block rounded-2xl p-6 bg-white/50 backdrop-blur">
            <p className="text-sm text-muted-foreground">
              所有方案均支援 LINE Pay 付款，安全便捷
            </p>
          </Card>
        </div>
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
