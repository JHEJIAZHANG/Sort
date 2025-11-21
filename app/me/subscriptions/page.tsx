"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ApiService } from '@/services/apiService'
import { useLineAuth } from '@/hooks/use-line-auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeftIcon } from '@/components/icons'

interface Subscription {
  id: string
  plan: {
    code: string
    name: string
    price_twd: number
  }
  status: 'active' | 'expired' | 'cancelled'
  start_at: string
  end_at: string
  created_at: string
}

interface Payment {
  id: string
  amount: number
  currency: string
  status: string
  payment_method: string
  created_at: string
  subscription?: {
    plan: {
      name: string
    }
  }
}

export default function SubscriptionsPage() {
  const router = useRouter()
  const { user, isLoggedIn } = useLineAuth()
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const effectiveId = user?.userId || ApiService.bootstrapLineUserId()
    if (effectiveId) {
      ApiService.setLineUserId(effectiveId)
      fetchData()
    }
  }, [isLoggedIn, user?.userId])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      // 獲取訂閱記錄
      const subsResp = await ApiService.getMySubscriptions()
      const subsData = (subsResp as any)?.data?.items || []
      setSubscriptions(subsData)

      // 獲取付款記錄（如果 API 支援）
      try {
        const paymentsResp = await ApiService.getMyPayments?.()
        const paymentsData = (paymentsResp as any)?.data?.items || []
        setPayments(paymentsData)
      } catch (e) {
        console.log('付款記錄 API 不可用')
        setPayments([])
      }
    } catch (e) {
      console.error('獲取資料失敗:', e)
      setError('無法載入資料，請稍後再試')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500 text-white rounded-full">使用中</Badge>
      case 'expired':
        return <Badge variant="secondary" className="rounded-full">已過期</Badge>
      case 'cancelled':
        return <Badge variant="destructive" className="rounded-full">已取消</Badge>
      default:
        return <Badge variant="outline" className="rounded-full">{status}</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">載入中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* 標題 */}
        <div className="mb-8 flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="rounded-xl"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            返回
          </Button>
          <h1 className="text-3xl font-bold">帳單紀錄</h1>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-sm">
            {error}
          </div>
        )}

        {/* 訂閱記錄 */}
        <div className="space-y-6 mb-12">
          <h2 className="text-xl font-semibold">訂閱記錄</h2>
          {subscriptions.length > 0 ? (
            <div className="space-y-4">
              {subscriptions.map((sub) => (
                <Card key={sub.id} className="rounded-2xl overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-violet-50 to-indigo-50">
                    <CardTitle className="flex items-center justify-between">
                      <span className="text-lg">{sub.plan.name}</span>
                      {getStatusBadge(sub.status)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground mb-1">方案代碼</p>
                        <p className="font-medium">{sub.plan.code}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1">金額</p>
                        <p className="font-medium">NT$ {sub.plan.price_twd}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1">開始日期</p>
                        <p className="font-medium">{formatDate(sub.start_at)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1">到期日期</p>
                        <p className="font-medium">{formatDate(sub.end_at)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="rounded-2xl p-8 text-center">
              <p className="text-muted-foreground mb-4">尚無訂閱記錄</p>
              <Button onClick={() => router.push('/pricing')} className="rounded-xl">
                查看方案
              </Button>
            </Card>
          )}
        </div>

        {/* 付款記錄 */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">付款記錄</h2>
          {payments.length > 0 ? (
            <div className="space-y-4">
              {payments.map((payment) => (
                <Card key={payment.id} className="rounded-2xl">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="font-medium">
                          {payment.subscription?.plan?.name || '方案購買'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(payment.created_at)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-violet-600">
                          {payment.currency} {payment.amount}
                        </p>
                        <Badge 
                          variant={payment.status === 'completed' ? 'default' : 'secondary'}
                          className="rounded-full mt-1"
                        >
                          {payment.status === 'completed' ? '已完成' : payment.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      付款方式：{payment.payment_method || 'LINE Pay'}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="rounded-2xl p-8 text-center">
              <p className="text-muted-foreground">尚無付款記錄</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
