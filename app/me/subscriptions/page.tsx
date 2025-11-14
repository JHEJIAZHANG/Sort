"use client"

import { useEffect, useMemo, useState } from 'react'
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

interface OrderItem {
  id: string
  order_no: string
  amount_twd: number
  currency: string
  status: string
  transaction_id?: string
  created_at: string
  plan: { id: string; code: string; name: string; period: string; price_twd: number }
  transactions?: Array<{ id: string; provider: string; transaction_id: string; status: string; created_at: string }>
}

export default function MySubscriptionsPage() {
  const { isLoggedIn, user } = useLineAuth()
  const [items, setItems] = useState<SubscriptionItem[]>([])
  const [orders, setOrders] = useState<OrderItem[]>([])
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
      const r2 = await ApiService.getMyOrders()
      setOrders(((r2 as any)?.data?.items || []) as OrderItem[])
      setLoading(false)
    })()
  }, [isLoggedIn, user?.userId])

  const now = Date.now()
  const current = useMemo(() => {
    return items.find(it => it.status === 'active' && new Date(it.end_at).getTime() > now) || null
  }, [items])

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold">我的授權</h1>
      {loading && <div>載入中…</div>}
      {error && <div className="text-red-600 text-sm">{error}</div>}
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>會員狀態</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {current ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base font-medium">{current.plan?.name || current.plan?.code}</span>
                <Badge>有效</Badge>
              </div>
              <div className="text-muted-foreground">到期日 {new Date(current.end_at).toLocaleDateString()}</div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base font-medium">Free</span>
                <Badge variant="secondary">未訂閱</Badge>
              </div>
              <Button size="sm" onClick={() => (window.location.href = '/pricing')}>前往升級</Button>
            </div>
          )}
        </CardContent>
      </Card>
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
          <Card key={it.id} className="rounded-2xl">
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

      <div className="pt-2">
        <h2 className="text-lg font-semibold mb-2">訂閱帳單</h2>
        {orders.length === 0 ? (
          <div className="text-sm text-muted-foreground">尚無帳單</div>
        ) : (
          orders.map(od => {
            const isPaid = od.status === 'paid'
            return (
              <Card key={od.id} className="rounded-2xl mb-3">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <span>{od.plan?.name || od.plan?.code}</span>
                      {isPaid ? <Badge>已支付</Badge> : <Badge variant="secondary">{od.status}</Badge>}
                    </span>
                    <span className="text-sm text-muted-foreground">NT$ {od.amount_twd}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-1">
                  <div>訂單編號：{od.order_no}</div>
                  <div>建立時間：{new Date(od.created_at).toLocaleString()}</div>
                  {od.transaction_id && <div>交易代碼：{od.transaction_id}</div>}
                  {od.transactions && od.transactions.length > 0 && (
                    <div className="pt-1">
                      <div className="text-xs text-muted-foreground">交易紀錄</div>
                      <ul className="text-xs list-disc pl-5">
                        {od.transactions.map(tx => (
                          <li key={tx.id}>{tx.status} · {new Date(tx.created_at).toLocaleString()}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
