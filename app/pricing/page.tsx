"use client"

import { useEffect, useState } from 'react'
import { ApiService } from '@/services/apiService'
import { useLineAuth } from '@/hooks/use-line-auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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

export default function PricingPage() {
  const { isInitialized, isLoggedIn, user, isLoading } = useLineAuth()
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const run = async () => {
      try {
        const resp = await ApiService.getPlans()
        const items: Plan[] = Array.isArray((resp as any)?.data) ? (resp as any).data : ((resp as any)?.data?.results || [])
        setPlans(items)
      } catch (e) {
        setError('載入方案失敗')
      }
    }
    run()
  }, [])

  const startCheckout = async (plan: Plan) => {
    try {
      setLoading(true)
      setError(null)
      const origin = typeof window !== 'undefined' ? window.location.origin : ''
      const confirmUrl = `${origin}/checkout/return`
      const cancelUrl = `${origin}/checkout/return`
      const resp = await ApiService.checkoutLinePayRequest({ planCode: plan.code, seatCount: 1, confirmUrl, cancelUrl })
      if ((resp as any)?.error) {
        setError((resp as any).error || '建立訂單失敗')
        setLoading(false)
        return
      }
      const redirectUrl = (resp as any)?.data?.redirectUrl || (resp as any)?.redirectUrl
      if (redirectUrl) {
        window.location.href = redirectUrl
      } else {
        setError('未取得支付連結')
        setLoading(false)
      }
    } catch (e) {
      setError('結帳請求失敗')
      setLoading(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold">教育方案</h1>
      {error && <div className="text-red-600 text-sm">{error}</div>}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans.map(p => (
          <Card key={p.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{p.name}</span>
                <span className="text-primary">NT$ {p.price_twd}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm text-muted-foreground">{p.description || ''}</div>
              <Button disabled={loading || !isInitialized} onClick={() => startCheckout(p)} className="w-full">
                使用 LINE Pay 購買
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

