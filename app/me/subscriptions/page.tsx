"use client"

import { useEffect, useState } from 'react'
import { ApiService } from '@/services/apiService'
import { useLineAuth } from '@/hooks/use-line-auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface SubscriptionItem {
  id: string
  status: string
  seat_count: number
  start_at: string
  end_at: string
  created_at: string
  plan: { id: string; code: string; name: string; period: string; price_twd: number }
}

export default function MySubscriptionsPage() {
  const { isLoggedIn, user } = useLineAuth()
  const [items, setItems] = useState<SubscriptionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isLoggedIn || !user?.userId) return
    ApiService.setLineUserId(user.userId)
    ;(async () => {
      setLoading(true)
      setError(null)
      const resp = await ApiService.getMySubscriptions()
      if ((resp as any)?.error) {
        setError((resp as any).error)
        setLoading(false)
        return
      }
      const data = (resp as any)?.data?.items || []
      setItems(data)
      setLoading(false)
    })()
  }, [isLoggedIn, user?.userId])

  const now = Date.now()

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold">我的授權</h1>
      {loading && <div>載入中…</div>}
      {error && <div className="text-red-600 text-sm">{error}</div>}
      {!loading && items.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>尚無有效授權</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-sm text-muted-foreground">前往方案頁選擇方案</div>
            <Button onClick={() => (window.location.href = '/pricing')}>前往方案</Button>
          </CardContent>
        </Card>
      )}
      {items.map(it => {
        const active = it.status === 'active' && new Date(it.end_at).getTime() > now
        return (
          <Card key={it.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span>{it.plan?.name || it.plan?.code}</span>
                  {active ? <Badge>有效</Badge> : <Badge variant="secondary">已到期</Badge>}
                </span>
                <span className="text-sm text-muted-foreground">NT$ {it.plan?.price_twd}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <div>狀態：{it.status}</div>
              <div>席次：{it.seat_count}</div>
              <div>起始：{new Date(it.start_at).toLocaleString()}</div>
              <div>到期：{new Date(it.end_at).toLocaleString()}</div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

